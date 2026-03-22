// Import the Express app instance from app.js
import app from "./app.js";
// Import dotenv to load environment variables from .env file
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import connectDB from "./db/db.js";

// Load environment variables into process.env
dotenv.config();

/**
 * Set the port for the server:
 * - Use PORT from environment variables if available
 * - Otherwise default to 8080
 */
const port = process.env.PORT || 8080;

/**
 * Set the environment:
 * - Use ENVIRONMENT from .env
 * - Default to 'development' if not provided
 */
const env = process.env.ENVIRONMENT || "development";

/**
 * Health Check Route
 * This endpoint is used to verify if the server is running properly
 * Commonly used in production monitoring and load balancers
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    message: "OK", // Server status message
    success: true, // Indicates request was successful
    timestamp: new Date().toISOString(), // Better readable timestamp
    environment: env, // Current environment (dev/prod)
  });
});

// Start Server ONLY after DB is connected
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    // Start server
    app.listen(port, () => {
      logger.info(`Server running on port ${port} in ${env} mode`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Initialize server
startServer();
