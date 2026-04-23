import http from "http";
import app from "./app.js";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import connectDB from "./db/db.js";
import redisClient, { connectRedis } from "./config/redis.js";
import { initializeSocket } from "./config/socket.js";
import { voteWorker } from "./queues/vote.queue.js"; // Initialize worker
import { updateElectionStatuses } from "./services/election.service.js";

// Load environment variables
dotenv.config();

co /
  nsole.log("ENV CHECK:-----", {
    DB: process.env.DATABASE_URL,
    REDIS: process.env.REDIS_URL,
  });
const port = process.env.PORT || 8080;
const env = process.env.ENVIRONMENT || "development";

// Create HTTP server (required for Socket.IO)
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Store io instance on app for use in controllers
app.set("io", io);

// Start Server after DB is connected
const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    // Use server.listen instead of app.listen (for Socket.IO)
    server.listen(port, () => {
      logger.info(`Server running on port ${port} in ${env} mode`);
      logger.info(`WebSocket server ready`);
    });

    // ── Auto Election Status Scheduler ──────────────────────────────────
    // Runs every 60 seconds to flip upcoming→active and active→completed
    const runStatusUpdate = async () => {
      try {
        await updateElectionStatuses();
        // Invalidate the elections cache so fresh data is served
        await redisClient.del("elections:all");
        logger.info("[Scheduler] Election statuses updated");
      } catch (err) {
        logger.error("[Scheduler] Failed to update election statuses:", err);
      }
    };
    // Run once immediately on startup, then every 60 seconds
    runStatusUpdate();
    setInterval(runStatusUpdate, 60 * 1000);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
