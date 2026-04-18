import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { handleGetAuditLogs } from "../controllers/audit.controller.js";

const auditRouter = express.Router();

// All audit routes require admin access
auditRouter.use(authenticate);
auditRouter.use(authorize("admin"));

// GET audit logs (paginated + filterable)
auditRouter.get("/", handleGetAuditLogs);

export default auditRouter;
