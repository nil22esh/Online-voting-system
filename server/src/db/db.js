// Import PostgreSQL client
import { Pool } from "pg";
import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

// Create a connection pool
// Pooling improves performance by reusing DB connections
export const pool = new Pool({
  user: process.env.DB_USER, // Database username
  host: process.env.DB_HOST, // Database host (e.g., localhost or AWS RDS)
  database: process.env.DB_NAME, // Database name
  password: process.env.DB_PASSWORD, // Database password
  port: Number(process.env.DB_PORT) || 5432, // Default PostgreSQL port
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout if connection takes too long
});

// Test database connection at startup
// This ensures DB is reachable before app starts serving requests
const connectDB = async () => {
  try {
    const client = await pool.connect();
    logger.info("Connected to PostgreSQL");
    client.release(); // Release client back to pool
  } catch (err) {
    logger.error("PostgreSQL connection error:", err.message);
    process.exit(1); // Exit app if DB connection fails (important for production)
  }
};

// Handle unexpected pool errors
pool.on("error", (err) => {
  logger.error("Unexpected PostgreSQL pool error", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Graceful shutdown
// Ensures all DB connections are closed when app stops
process.on("SIGINT", async () => {
  logger.info("Shutting down PostgreSQL pool...");
  await pool.end();
  process.exit(0);
});

// Export pool to use in queries
export default connectDB;
