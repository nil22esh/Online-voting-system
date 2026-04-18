import http from "http"; 
import app from "./app.js";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import connectDB from "./db/db.js";
import { connectRedis } from "./config/redis.js";
import { initializeSocket } from "./config/socket.js";
import { voteWorker } from "./queues/vote.queue.js"; // Initialize worker

// Load environment variables
dotenv.config();

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
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
