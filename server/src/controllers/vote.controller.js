import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import {
  getElectionResults,
  checkUserVote,
  getTotalVotes,
  verifyVoteByHash,
  getElectionWinner,
  // castVote, // Moving to worker
} from "../services/vote.service.js";
import { generateOTP, verifyOTP } from "../services/otp.service.js";
import { createAuditLog } from "../services/audit.service.js";
import { voteQueue } from "../queues/vote.queue.js";
import { successResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";
import { sendOTPEmail } from "../services/email.service.js";
import { findUserById } from "../services/auth.service.js";

/**
 * Request an OTP for voting verification
 * POST /api/v1/votes/request-otp
 * Access: voter only
 */
export const handleRequestOTP = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  
  // Get user details to verify phone number and verification status
  const { pool } = await import("../db/db.js");
  const userRes = await pool.query("SELECT phone_number, is_verified FROM users WHERE id = $1", [req.user.id]);
  const userFromDb = userRes.rows[0];

  if (!userFromDb) {
    throw new ApiError(404, "User registration details not found");
  }

  // 1. Check if user is verified
  if (!userFromDb.is_verified) {
    throw new ApiError(403, "Your email is not verified. Please verify your email to participate in voting.");
  }

  // 2. Verify phone number
  if (phoneNumber !== userFromDb.phone_number) {
    throw new ApiError(400, "The phone number entered does not match our registration records");
  }

  const code = await generateOTP(req.user.id);
  
  // Get full user details to send email
  const user = await findUserById(req.user.id);
  
  if (!user || !user.email) {
    throw new ApiError(404, "User email not found for OTP delivery");
  }

  // Send OTP Email (Non-blocking)
  sendOTPEmail(user, code).catch(err => console.error("Failed to send OTP email:", err));

  const maskedEmail = user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => { 
    return gp2 + gp3.replace(/./g, "*"); 
  });

  return successResponse(
    res, 
    { message: `OTP sent to your registered email: ${maskedEmail}. Please check your inbox.` }, 
    "OTP generated successfully", 
    200
  );
});


/**
 * Cast a vote
 * POST /api/v1/votes
 * Access: voter only
 */
export const handleCastVote = asyncHandler(async (req, res) => {
  const { election_id, candidate_id, otp_code } = req.body;

  // 1. Check if user is verified (fetch from DB for latest status)
  const { pool } = await import("../db/db.js");
  const userRes = await pool.query("SELECT is_verified FROM users WHERE id = $1", [req.user.id]);
  const userFromDb = userRes.rows[0];

  if (!userFromDb?.is_verified) {
    throw new ApiError(403, "Your email is not verified. Please verify your email to participate in voting.");
  }

  // 2. Verify OTP
  if (!otp_code) {
    throw new ApiError(400, "OTP verification code is required to vote");
  }

  const isOtpValid = await verifyOTP(req.user.id, otp_code);
  if (!isOtpValid) {
    throw new ApiError(400, "Invalid or expired OTP code");
  }

  // 2. Check if user already has a pending or completed vote for this election
  // (Basic check before queueing to avoid obvious duplicates)
  const existingVote = await checkUserVote(req.user.id, election_id);
  if (existingVote) {
    throw new ApiError(409, "You have already voted in this election");
  }

  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // 3. Prevent duplicate queue jobs for same user/election
    const jobId = `vote-${req.user.id}-${election_id}`;
    const existingJob = await voteQueue.getJob(jobId);
    if (existingJob) {
      throw new ApiError(409, "Your vote is already being processed");
    }

    // 4. Add vote to queue for asynchronous processing
    await voteQueue.add(jobId, {
      userId: req.user.id,
      electionId: election_id,
      candidateId: candidate_id,
      ipAddress,
      userAgent
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    // 5. Audit log (initial submission)

    await createAuditLog(
      req.user.id,
      "SUBMIT_VOTE_QUEUE",
      "election",
      election_id,
      { candidate_id },
      ipAddress,
    );

    return successResponse(res, null, "Your vote has been submitted and is being processed", 202);
  } catch (error) {
    throw error;
  }
});

/**
 * Verify a vote by hash
 * GET /api/v1/votes/verify/:hash
 * Access: public
 */
export const handleVerifyVote = asyncHandler(async (req, res) => {
  const { hash } = req.params;
  const vote = await verifyVoteByHash(hash);

  if (!vote) {
    throw new ApiError(404, "Invalid vote hash or integrity broken.");
  }

  return successResponse(res, vote, "Vote integrity verified", 200);
});

/**
 * Get election results
 * GET /api/v1/votes/results/:electionId
 * Access: all authenticated users
 */
export const handleGetResults = asyncHandler(async (req, res) => {
  const resultData = await getElectionResults(req.params.electionId);
  const totalVotes = await getTotalVotes(req.params.electionId);

  // Get election to check status
  const { pool } = await import("../db/db.js");
  const electionRes = await pool.query("SELECT status, results_published FROM elections WHERE id = $1", [req.params.electionId]);
  const election = electionRes.rows[0];

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  // Get fresh user role from DB in case JWT is out of sync
  const userRes = await pool.query("SELECT role FROM users WHERE id = $1", [req.user.id]);
  const userRole = userRes.rows[0]?.role || req.user.role;

  // Voters can see results if: results_published OR election is completed
  const resultsPublished = election.results_published || false;
  const isCompleted = election.status === "completed";
  if (userRole === "voter" && !resultsPublished && !isCompleted) {
    throw new ApiError(403, "Results are not yet available for this election");
  }

  // Include winner data for completed elections
  let winner = null;
  if (isCompleted || resultsPublished) {
    winner = await getElectionWinner(req.params.electionId);
  }

  return successResponse(
    res,
    { results: resultData, totalVotes, winner, isCompleted },
    "Results fetched successfully",
    200,
  );
});

/**
 * Check if user has voted in an election
 * GET /api/v1/votes/check/:electionId
 * Access: all authenticated users
 */
export const handleCheckVote = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { electionId } = req.params;

  // 1. Check database first
  const vote = await checkUserVote(userId, electionId);
  if (vote) {
    return successResponse(
      res,
      { hasVoted: true, vote, status: 'confirmed' },
      "You have already voted",
      200,
    );
  }

  // 2. Check the queue for pending votes
  const jobId = `vote-${userId}-${electionId}`;
  const job = await voteQueue.getJob(jobId);

  if (job) {
    const state = await job.getState();
    if (state !== 'failed') {
      return successResponse(
        res,
        { hasVoted: true, vote: { candidate_name: "Processing..." }, status: 'pending' },
        "Your vote is currently being processed",
        200,
      );
    }
  }

  return successResponse(
    res,
    { hasVoted: false, vote: null, status: 'none' },
    "You have not voted yet",
    200,
  );
});

