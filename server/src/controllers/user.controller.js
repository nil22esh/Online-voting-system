import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from "../services/user.service.js";
import { successResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";

// Get list of all users
export const handleGetAllUsers = asyncHandler(async (req, res) => {
  const users = await getAllUsers();
  return successResponse(res, users, "Users fetched successfully", 200);
});

// Update user role (admin, officer, voter)
export const handleUpdateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!["admin", "officer", "voter"].includes(role)) {
    throw new ApiError(400, "Invalid role provided");
  }

  // Prevent admin from changing their own role if needed, but for now just update.
  if (req.user.id === id && role !== "admin") {
    throw new ApiError(403, "You cannot downgrade your own admin role");
  }

  const updatedUser = await updateUserRole(id, role);
  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return successResponse(
    res,
    updatedUser,
    "User role updated successfully",
    200,
  );
});

// Update user active/deactive status
export const handleUpdateUserStatus = asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  const { id } = req.params;

  if (typeof is_active !== "boolean") {
    throw new ApiError(400, "is_active must be a boolean");
  }

  if (req.user.id === id && !is_active) {
    throw new ApiError(403, "You cannot deactivate your own account");
  }

  const updatedUser = await updateUserStatus(id, is_active);
  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return successResponse(
    res,
    updatedUser,
    "User status updated successfully",
    200,
  );
});
