// Import PostgreSQL client
import { Pool } from "pg";
import logger from "../utils/logger.js";

// Build pool config from DATABASE_URL or individual env vars
const getPoolConfig = () => {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    // Determine if SSL is needed (Supabase always requires SSL)
    const requireSSL =
      dbUrl.includes("supabase") ||
      dbUrl.includes("pooler.supabase") ||
      process.env.NODE_ENV === "production";

    return {
      connectionString: dbUrl,
      ssl: requireSSL ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased from 2s → 10s for Supabase cold starts
    };
  }

  // Fallback: individual env vars
  return {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
};

export const pool = new Pool(getPoolConfig());

// Test database connection at startup
const connectDB = async () => {
  const config = getPoolConfig();

  // Log which connection mode is being used (without exposing credentials)
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    logger.info(`Connecting to PostgreSQL at ${url.host}${url.pathname}`, {
      ssl: !!config.ssl,
    });
  } else {
    logger.info(
      `Connecting to PostgreSQL at ${config.host}:${config.port}/${config.database}`,
    );
  }

  try {
    const client = await pool.connect();
    logger.info("Connected to PostgreSQL successfully");
    client.release();
  } catch (err) {
    // Log the full error for debugging, not just err.message
    logger.error("PostgreSQL connection error", {
      message: err.message,
      code: err.code, // e.g. ECONNREFUSED, ETIMEDOUT, 28P01 (wrong password)
      stack: err.stack,
    });
    process.exit(1);
  }
};

// Handle unexpected pool errors (e.g. connection dropped mid-use)
pool.on("error", (err) => {
  logger.error("Unexpected PostgreSQL pool error", {
    message: err.message,
    code: err.code,
    stack: err.stack,
  });
  process.exit(1);
});

// Graceful shutdown — close all connections before process exits
process.on("SIGINT", async () => {
  logger.info("Shutting down PostgreSQL pool...");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down PostgreSQL pool (SIGTERM)...");
  await pool.end();
  process.exit(0);
});

export default connectDB;
