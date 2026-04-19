import express from "express";
import validate from "../middlewares/validateValidations.middleware.js";
import {
  loginValidations,
  registerValidations,
} from "../validations/auth.validations.js";
import {
  login,
  register,
  logout,
  refreshAccessToken,
  getMe,
  verifyUserEmail,
  googleAuthRedirect,
  googleCallback,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const authRouter = express.Router();

// Public routes (rate limited)
authRouter.post("/register", authLimiter, validate(registerValidations), register);
authRouter.post("/login", authLimiter, validate(loginValidations), login);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.get("/verify-email/:token", verifyUserEmail);

// Protected routes
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, getMe);

// Google OAuth routes
authRouter.get("/google", googleAuthRedirect);
authRouter.get("/google/callback", googleCallback);

export default authRouter;
