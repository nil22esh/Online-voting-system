import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import { getAuditLogs } from "../services/audit.service.js";
import { successResponse } from "../utils/response.js";

/**
 * Get audit logs (paginated)
 * GET /api/v1/audit
 * Access: admin only
 */
export const handleGetAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filters = {};

  if (req.query.userId) filters.userId = req.query.userId;
  if (req.query.action) filters.action = req.query.action;
  if (req.query.entity) filters.entity = req.query.entity;

  const result = await getAuditLogs(page, limit, filters);

  return successResponse(res, result, "Audit logs fetched successfully", 200);
});
