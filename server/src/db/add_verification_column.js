import { pool } from "./db.js";
import logger from "../utils/logger.js";

const migrate = async () => {
  try {
    logger.info("Starting email verification column migration...");
    
    // 1. Add verification_token column if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
    `);
    
    // 2. Change is_verified default to FALSE
    await pool.query(`
      ALTER TABLE users 
      ALTER COLUMN is_verified SET DEFAULT FALSE;
    `);

    logger.info("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    logger.error("Migration failed:", err.message);
    process.exit(1);
  }
};

migrate();
