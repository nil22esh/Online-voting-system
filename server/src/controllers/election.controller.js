import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import {
  createElection,
  getAllElections,
  getElectionById,
  updateElection,
  deleteElection,
} from "../services/election.service.js";
import redisClient from "../config/redis.js";
import { createAuditLog } from "../services/audit.service.js";
import { successResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";

/**
 * Create a new election
 * POST /api/v1/elections
 * Access: admin, officer
 */
export const handleCreateElection = asyncHandler(async (req, res) => {
  const { title, description, start_time, end_time, is_anonymous, election_level } = req.body;

  const election = await createElection(
    title,
    description,
    start_time,
    end_time,
    req.user.id,
    is_anonymous,
    election_level
  );

  // Invalidate cache
  await redisClient.del("elections:all");

  // Audit log
  await createAuditLog(
    req.user.id,
    "CREATE_ELECTION",
    "election",
    election.id,
    { title },
    req.ip,
  );

  return successResponse(res, election, "Election created successfully", 201);
});

/**
 * Get all elections (Cached)
 * GET /api/v1/elections
 * Access: all authenticated users
 */
export const handleGetAllElections = asyncHandler(async (req, res) => {
  const cacheKey = "elections:all";
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    return successResponse(res, JSON.parse(cachedData), "Elections fetched from cache", 200);
  }

  const elections = await getAllElections();
  
  // Cache for 5 minutes
  await redisClient.setEx(cacheKey, 300, JSON.stringify(elections));
  
  return successResponse(res, elections, "Elections fetched successfully", 200);
});

/**
 * Get election by ID
 * GET /api/v1/elections/:id
 * Access: all authenticated users
 */
export const handleGetElectionById = asyncHandler(async (req, res) => {
  const election = await getElectionById(req.params.id);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  return successResponse(res, election, "Election fetched successfully", 200);
});

/**
 * Update an election
 * PUT /api/v1/elections/:id
 * Access: admin, officer (who created it)
 */
export const handleUpdateElection = asyncHandler(async (req, res) => {
  const existing = await getElectionById(req.params.id);

  if (!existing) {
    throw new ApiError(404, "Election not found");
  }

  // Officers can only update their own elections
  if (req.user.role === "officer" && existing.created_by !== req.user.id) {
    throw new ApiError(403, "You can only update elections you created");
  }

  const { title, description, start_time, end_time, status, is_anonymous, election_level, results_published } = req.body;

  const updated = await updateElection(
    req.params.id,
    title || existing.title,
    description || existing.description,
    start_time || existing.start_time,
    end_time || existing.end_time,
    status || existing.status,
    is_anonymous !== undefined ? is_anonymous : existing.is_anonymous,
    election_level || existing.election_level,
    results_published !== undefined ? results_published : existing.results_published
  );

  // Invalidate cache
  await redisClient.del("elections:all");
  await redisClient.del(`election:${req.params.id}`);

  // Audit log
  await createAuditLog(
    req.user.id,
    "UPDATE_ELECTION",
    "election",
    req.params.id,
    { title: updated.title, status: updated.status },
    req.ip,
  );

  return successResponse(res, updated, "Election updated successfully", 200);
});

/**
 * Delete an election
 * DELETE /api/v1/elections/:id
 * Access: admin only
 */
export const handleDeleteElection = asyncHandler(async (req, res) => {
  const existing = await getElectionById(req.params.id);

  if (!existing) {
    throw new ApiError(404, "Election not found");
  }

  await deleteElection(req.params.id);

  // Audit log
  await createAuditLog(
    req.user.id,
    "DELETE_ELECTION",
    "election",
    req.params.id,
    { title: existing.title },
    req.ip,
  );

  // Invalidate cache
  await redisClient.del("elections:all");
  await redisClient.del(`election:${req.params.id}`);

  return successResponse(res, null, "Election deleted successfully", 200);
});
