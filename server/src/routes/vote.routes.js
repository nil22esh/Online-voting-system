import express from "express";
import validate from "../middlewares/validateValidations.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { voteLimiter } from "../middlewares/rateLimit.middleware.js";
import { castVoteValidation, requestOTPValidation } from "../validations/vote.validations.js";
import {
  handleCastVote,
  handleGetResults,
  handleCheckVote,
  handleVerifyVote,
  handleRequestOTP,
} from "../controllers/vote.controller.js";

const voteRouter = express.Router();

// Public route for vote verification
voteRouter.get("/verify/:hash", handleVerifyVote);

// All other routes require authentication
voteRouter.use(authenticate);

// POST request OTP (voters only)
voteRouter.post(
  "/request-otp",
  authorize("voter"),
  validate(requestOTPValidation),
  handleRequestOTP
);


// POST cast vote (voters only, rate limited)
voteRouter.post(
  "/",
  authorize("voter"),
  voteLimiter,
  validate(castVoteValidation),
  handleCastVote,
);

// GET election results (any authenticated user)
voteRouter.get("/results/:electionId", handleGetResults);

// GET check if user has voted (any authenticated user)
voteRouter.get("/check/:electionId", handleCheckVote);

export default voteRouter;
