import { pool } from "../db/db.js";

/**
 * Get all users except password
 */
export const getAllUsers = async () => {
  const query = `
    SELECT id, name, email, role, is_active, is_verified, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Update user role
 */
export const updateUserRole = async (userId, role) => {
  const query = `
    UPDATE users 
    SET role = $1
    WHERE id = $2
    RETURNING id, name, email, role, is_active, is_verified, created_at, updated_at
  `;
  const result = await pool.query(query, [role, userId]);
  return result.rows[0];
};

/**
 * Update user active status
 */
export const updateUserStatus = async (userId, isActive) => {
  const query = `
    UPDATE users 
    SET is_active = $1
    WHERE id = $2
    RETURNING id, name, email, role, is_active, is_verified, created_at, updated_at
  `;
  const result = await pool.query(query, [isActive, userId]);
  return result.rows[0];
};
