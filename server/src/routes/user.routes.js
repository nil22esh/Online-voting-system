import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  handleGetAllUsers,
  handleUpdateUserRole,
  handleUpdateUserStatus,
} from "../controllers/user.controller.js";

const userRouter = express.Router();

// All user routes require authentication and admin access
userRouter.use(authenticate);
userRouter.use(authorize("admin"));

// GET all users
userRouter.get("/", handleGetAllUsers);

// PATCH update user role
userRouter.patch("/:id/role", handleUpdateUserRole);

// PATCH update user status
userRouter.patch("/:id/status", handleUpdateUserStatus);

export default userRouter;
