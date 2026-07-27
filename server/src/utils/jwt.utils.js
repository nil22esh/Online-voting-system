import jwt from "jsonwebtoken";
import config from "../config/config.js";

// Generate short-lived JWT access token
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

// Generate long-lived JWT refresh token
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
};

// Verify JWT token signature and return payload
export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

// Set authentication cookies on response
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

// Clear authentication cookies
export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh-token" });
};
