import bcrypt from "bcrypt";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import { validateAadhar } from "../utils/voter.utils.js";
import { sendVerificationEmail } from "../services/email.service.js";
import crypto from "crypto";
import {
  createUser,
  findUserByEmail,
  findUserById,
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllUserRefreshTokens,
  findUserByVerificationToken,
  updateUserVerificationStatus,
} from "../services/auth.service.js";
import { successResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies,
} from "../utils/jwt.utils.js";
import config from "../config/config.js";

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone_number, aadhar_number } = req.body;
  const role = "voter"; // Force voter role on self-registration

  // 1. Check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  // 2. Proper Aadhar Validation (Verhoeff Checksum)
  if (!validateAadhar(aadhar_number)) {
    throw new ApiError(400, "Invalid Aadhar number. Please check for typos.");
  }

  // 3. Hash password with bcrypt (12 salt rounds for security)
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // 5. Create user in database
  const newUser = await createUser(
    name,
    email,
    hashedPassword,
    phone_number,
    aadhar_number,
    verificationToken,
    role,
  );

  // Generate tokens (Allow login but restrict operations via verify checks)
  const tokenPayload = {
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
  };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Save refresh token to DB
  const expiresAt = new Date(Date.now() + config.jwt.refreshExpiryMs);
  await saveRefreshToken(newUser.id, refreshToken, expiresAt);

  // Set cookies
  setAuthCookies(res, accessToken, refreshToken);

  // 6. Send Verification Email (Non-blocking)
  sendVerificationEmail(newUser, verificationToken).catch(err => 
    console.error("Failed to send verification email:", err)
  );

  return successResponse(
    res, 
    { ...newUser, is_verified: false }, 
    "Registration successful. Please check your email to verify your account.", 
    201
  );
});

/**
 * Verify User Email
 * GET /api/v1/auth/verify-email/:token
 */
export const verifyUserEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  // 1. Find user by token
  const user = await findUserByVerificationToken(token);
  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  if (user.is_verified) {
    return successResponse(res, null, "Email is already verified", 200);
  }

  // 2. Update user status
  await updateUserVerificationStatus(user.id);

  // In a real app, you might want to redirect to a frontend success page
  return successResponse(res, null, "Email verified successfully! You can now participate in elections.", 200);
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Check if user is active
  console.log("user", user);
  if (!user.is_active) {
    throw new ApiError(
      403,
      "Your account has been deactivated. Please contact support.",
    );
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate tokens
  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Save refresh token to DB
  const expiresAt = new Date(Date.now() + config.jwt.refreshExpiryMs);
  await saveRefreshToken(user.id, refreshToken, expiresAt);

  // Set cookies
  setAuthCookies(res, accessToken, refreshToken);

  // Remove password before sending response
  delete user.password;

  return successResponse(res, user, "User logged in successfully", 200);
});

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await deleteRefreshToken(refreshToken);
  }

  clearAuthCookies(res);

  return successResponse(res, null, "Logged out successfully", 200);
});

/**
 * Refresh access token
 * POST /api/v1/auth/refresh-token
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;

  if (!oldRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  // Verify JWT signature first
  let decoded;
  try {
    decoded = verifyToken(oldRefreshToken, config.jwt.refreshSecret);
  } catch {
    clearAuthCookies(res);
    throw new ApiError(401, "Invalid refresh token");
  }

  // Verify old refresh token exists in DB and is not expired
  const storedToken = await findRefreshToken(oldRefreshToken);
  if (!storedToken) {
    // Token was already rotated (race condition) or expired
    clearAuthCookies(res);
    throw new ApiError(401, "Refresh token expired or already used");
  }

  // Delete old refresh token (token rotation)
  await deleteRefreshToken(oldRefreshToken);

  // Generate new tokens
  const tokenPayload = {
    id: storedToken.uid,
    email: storedToken.email,
    role: storedToken.role,
  };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Save new refresh token
  const expiresAt = new Date(Date.now() + config.jwt.refreshExpiryMs);
  await saveRefreshToken(storedToken.uid, newRefreshToken, expiresAt);

  // Set new cookies
  setAuthCookies(res, newAccessToken, newRefreshToken);

  return successResponse(res, null, "Token refreshed successfully", 200);
});

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return successResponse(res, user, "User profile fetched successfully", 200);
});
