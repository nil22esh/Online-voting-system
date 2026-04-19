// Import PostgreSQL connection pool
import { pool } from "../db/db.js";

// =============================================
// USER OPERATIONS
// =============================================

/**
 * Create a new user in the database
 */
export const createUser = async (
  name,
  email,
  hashedPassword,
  phone_number,
  aadhar_number,
  verification_token,
  role = "voter",
) => {
  const normalizedEmail = email.toLowerCase().trim();

  const query = `
    INSERT INTO users (name, email, password, phone_number, aadhar_number, role, verification_token) 
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, email, role, phone_number, aadhar_number, is_active, is_verified, created_at
  `;

  const values = [
    name,
    normalizedEmail,
    hashedPassword,
    phone_number,
    aadhar_number,
    role,
    verification_token,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Email already exists");
    }
    throw error;
  }
};

/**
 * Find user by verification token
 */
export const findUserByVerificationToken = async (token) => {
  const query = `
    SELECT id, name, email, is_verified 
    FROM users 
    WHERE verification_token = $1
  `;

  const result = await pool.query(query, [token]);
  return result.rows[0];
};

/**
 * Update user verification status
 */
export const updateUserVerificationStatus = async (userId) => {
  const query = `
    UPDATE users 
    SET is_verified = TRUE, verification_token = NULL 
    WHERE id = $1
    RETURNING id, name, email, is_verified
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

/**
 * Find user by email (includes password for auth comparison)
 */
export const findUserByEmail = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  const query = `
    SELECT id, name, email, password, role, phone_number, aadhar_number, is_active, is_verified 
    FROM users 
    WHERE email = $1
  `;

  const result = await pool.query(query, [normalizedEmail]);
  return result.rows[0];
};

/**
 * Find user by ID (excludes password)
 */
export const findUserById = async (id) => {
  const query = `
    SELECT id, name, email, role, phone_number, aadhar_number, is_active, is_verified, created_at 
    FROM users 
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async () => {
  const query = `
    SELECT id, name, email, role, is_active, is_verified, created_at 
    FROM users 
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// =============================================
// GOOGLE OAUTH OPERATIONS
// =============================================

/**
 * Find user by Google ID
 */
export const findUserByGoogleId = async (googleId) => {
  const query = `
    SELECT id, name, email, role, phone_number, aadhar_number, 
           is_active, is_verified, google_id, avatar_url, created_at
    FROM users
    WHERE google_id = $1
  `;
  const result = await pool.query(query, [googleId]);
  return result.rows[0];
};

/**
 * Create a new user via Google OAuth (no password/Aadhar required)
 */
export const createGoogleUser = async (name, email, googleId, avatarUrl) => {
  const normalizedEmail = email.toLowerCase().trim();

  const query = `
    INSERT INTO users (name, email, google_id, avatar_url, role, is_verified)
    VALUES ($1, $2, $3, $4, 'voter', false)
    RETURNING id, name, email, role, phone_number, aadhar_number,
              is_active, is_verified, google_id, avatar_url, created_at
  `;

  try {
    const result = await pool.query(query, [name, normalizedEmail, googleId, avatarUrl]);
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Email already exists");
    }
    throw error;
  }
};

/**
 * Link a Google account to an existing user (matched by email)
 */
export const linkGoogleAccount = async (userId, googleId, avatarUrl) => {
  const query = `
    UPDATE users
    SET google_id = $2, avatar_url = COALESCE(avatar_url, $3)
    WHERE id = $1
    RETURNING id, name, email, role, phone_number, aadhar_number,
              is_active, is_verified, google_id, avatar_url, created_at
  `;
  const result = await pool.query(query, [userId, googleId, avatarUrl]);
  return result.rows[0];
};

// =============================================
// REFRESH TOKEN OPERATIONS
// =============================================

/**
 * Save a refresh token to the database
 */
export const saveRefreshToken = async (userId, token, expiresAt) => {
  const query = `
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id
  `;

  const result = await pool.query(query, [userId, token, expiresAt]);
  return result.rows[0];
};

/**
 * Find a refresh token in the database
 */
export const findRefreshToken = async (token) => {
  const query = `
    SELECT rt.*, u.id as uid, u.name, u.email, u.role, u.phone_number, u.aadhar_number, u.is_active, u.is_verified
    FROM refresh_tokens rt
    JOIN users u ON rt.user_id = u.id
    WHERE rt.token = $1 AND rt.expires_at > NOW()
  `;

  const result = await pool.query(query, [token]);
  return result.rows[0];
};

/**
 * Delete a refresh token (logout)
 */
export const deleteRefreshToken = async (token) => {
  const query = `DELETE FROM refresh_tokens WHERE token = $1`;
  await pool.query(query, [token]);
};

/**
 * Delete all refresh tokens for a user (force logout all sessions)
 */
export const deleteAllUserRefreshTokens = async (userId) => {
  const query = `DELETE FROM refresh_tokens WHERE user_id = $1`;
  await pool.query(query, [userId]);
};
