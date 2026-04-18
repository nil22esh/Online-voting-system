import { Queue, Worker } from "bullmq";
import redisClient from "../config/redis.js";
import { castVote, getElectionResults, getTotalVotes } from "../services/vote.service.js";
import { getIO } from "../config/socket.js";
import logger from "../utils/logger.js";
import { sendVoteConfirmationEmail } from "../services/email.service.js";
import { findUserById } from "../services/auth.service.js";
import { getElectionById } from "../services/election.service.js";



const connection = {
  host: "localhost",
  port: 6379,
};

// 1. Create the Vote Queue
export const voteQueue = new Queue("vote-processing", { connection });

// 2. Define the Worker logic
export const voteWorker = new Worker(
  "vote-processing",
  async (job) => {
    const { userId, electionId, candidateId, ipAddress, userAgent } = job.data;
    
    try {
      logger.info(`Processing vote job ${job.id} for user ${userId}`);
      const vote = await castVote(userId, electionId, candidateId, ipAddress, userAgent);
      
      // Emit live update via Socket.IO
      try {
        const io = getIO();
        const results = await getElectionResults(electionId);
        const totalVotes = await getTotalVotes(electionId);
        
        io.to(`election:${electionId}`).emit("vote:update", {
          electionId,
          results,
          totalVotes
        });
        
        // Broadcast to all connected clients for real-time dashboard updates
        io.emit("vote:global_update", {
          electionId,
          totalVotes
        });
        
        logger.debug(`Broadcasted live update for election ${electionId}`);
      } catch (socketError) {
        logger.error(`Failed to broadcast socket update: ${socketError.message}`);
        // Don't fail the job if socket broadcast fails
      }

      // Send Vote Confirmation Email (Non-blocking)
      try {
        const user = await findUserById(userId);
        const election = await getElectionById(electionId);
        if (user && user.email && election) {
          sendVoteConfirmationEmail(user, election.title).catch(emailErr => 
            logger.error(`Failed to send vote confirmation email: ${emailErr.message}`)
          );
        }
      } catch (infoError) {
        logger.error(`Failed to fetch info for confirmation email: ${infoError.message}`);
      }

      logger.info(`Vote processed successfully for job ${job.id}`);

      // Invalidate elections list cache since vote count changed
      await redisClient.del("elections:all");

      return vote;
    } catch (error) {
      logger.error(`Failed to process vote job ${job.id}: ${error.message}`);
      throw error;
    }

  },
  { connection, concurrency: 5 }
);

voteWorker.on("completed", (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

voteWorker.on("failed", (job, err) => {
  logger.error(`Job ${job.id} failed with error: ${err.message}`);
});
