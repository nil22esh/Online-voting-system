// Import winston logging library
import winston from "winston";

// Determine environment:
// Default to 'development' if ENVIRONMENT is not set
const env = process.env.ENVIRONMENT || "development";

// Create a logger instance
const logger = winston.createLogger({
  // Set log level based on environment:
  // - 'debug' for development (more verbose logs)
  // - 'info' for production (less noisy logs)
  level: env === "development" ? "debug" : "info",

  // Define log format:
  // - Add timestamp
  // - Capture errors with stack trace
  // - Convert logs into JSON format (useful for production & monitoring tools)
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),

  // Default metadata added to every log
  defaultMeta: { service: "user-service" },

  // Define log storage (transports)
  transports: [
    // Store only error logs in error.log
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),

    // Store all logs in combined.log
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// Add console logging for non-production environments
// Helps during development/debugging
if (env !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Adds colors to logs
        winston.format.simple(), // Simple readable format
      ),
    }),
  );
}

// Export logger to use across the application
export default logger;
