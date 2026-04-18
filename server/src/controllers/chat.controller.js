import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import { processMessage } from "../services/chat.service.js";
import { successResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";

/**
 * Handle a chat message
 * POST /api/v1/chat
 * Access: all authenticated users
 */
export const handleChat = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    throw new ApiError(400, "Message is required");
  }

  if (message.trim().length > 500) {
    throw new ApiError(400, "Message is too long (max 500 characters)");
  }

  const result = await processMessage(message.trim(), req.user);

  return successResponse(res, result, "Message processed", 200);
});
