import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.utils.js";
import config from "../config/config.js";
import logger from "../utils/logger.js";

let io;

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - Node.js HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware for WebSocket connections
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split("; ")
          ?.find((c) => c.startsWith("accessToken="))
          ?.split("=")[1];

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyToken(token, config.jwt.secret);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error("Invalid authentication token"));
    }
  });

  // Handle connections
  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.user.email} (${socket.id})`);

    // Join election room for real-time updates
    socket.on("join:election", (electionId) => {
      socket.join(`election:${electionId}`);
      logger.debug(`${socket.user.email} joined election room: ${electionId}`);
    });

    // Leave election room
    socket.on("leave:election", (electionId) => {
      socket.leave(`election:${electionId}`);
      logger.debug(`${socket.user.email} left election room: ${electionId}`);
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info(`User disconnected: ${socket.user.email} - ${reason}`);
    });
  });

  return io;
};

/**
 * Get the current Socket.IO server instance
 * @returns {Object} Socket.IO server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};

