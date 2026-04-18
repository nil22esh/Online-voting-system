import { pool } from "../db/db.js";
import logger from "../utils/logger.js";
import { findUserById } from "./auth.service.js";

/**
 * Generate a 6-digit OTP code and store it in the database.
 * 
 * @param {string} userId - ID of the user
 * @returns {Promise<string>} The generated OTP code
 */
export const generateOTP = async (userId) => {
  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 5 minutes from now
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const query = `
    INSERT INTO otps (user_id, code, expires_at)
    VALUES ($1, $2, $3)
    RETURNING code
  `;

  try {
    // Delete any existing OTPs for this user first
    await pool.query("DELETE FROM otps WHERE user_id = $1", [userId]);
    
    const result = await pool.query(query, [userId, code, expiresAt]);
    
    // Fetch user to get their phone number for the mock log
    const user = await findUserById(userId);
    const destination = user?.phone_number || "registered device";
    const maskedPhone = destination.slice(-4).padStart(destination.length, "*");
    
    logger.info(`Voting Verification: Mock OTP [${code}] sent to user ${userId} (+91 ${maskedPhone})`);
    return result.rows[0].code;
  } catch (error) {
    logger.error(`Error generating OTP: ${error.message}`);
    throw error;
  }
};

/**
 * Verify an OTP code for a user.
 * 
 * @param {string} userId - ID of the user
 * @param {string} code - The OTP code to verify
 * @returns {Promise<boolean>} True if valid
 */
export const verifyOTP = async (userId, code) => {
  const query = `
    SELECT id FROM otps
    WHERE user_id = $1 AND code = $2 AND expires_at > NOW()
  `;

  try {
    const result = await pool.query(query, [userId, code]);
    
    if (result.rows.length > 0) {
      // Valid OTP, delete it so it can't be reused
      await pool.query("DELETE FROM otps WHERE id = $1", [result.rows[0].id]);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    throw error;
  }
};
