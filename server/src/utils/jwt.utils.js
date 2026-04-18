import jwt from "jsonwebtoken";
import config from "../config/config.js";

/**
 * Generate JWT access token (short-lived: 15 min)
 * @param {Object} payload - User data to encode
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

/**
 * Generate JWT refresh token (long-lived: 7 days)
 * @param {Object} payload - User data to encode
 * @returns {string} JWT token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
};

/**
 * Verify a JWT token
 * @param {string} token - Token to verify
 * @param {string} secret - Secret key to verify against
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

/**
 * Set authentication cookies on the response
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: config.cookies.httpOnly,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite,
    maxAge: config.cookies.accessMaxAge,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: config.cookies.httpOnly,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite,
    maxAge: config.cookies.refreshMaxAge,
    path: "/api/v1/auth/refresh-token", // Only sent to refresh endpoint
  });
};

/**
 * Clear authentication cookies
 * @param {Object} res - Express response object
 */
export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh-token" });
};
