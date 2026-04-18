import express from "express";
import validate from "../middlewares/validateValidations.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  addCandidateValidation,
  updateCandidateValidation,
} from "../validations/candidate.validations.js";
import {
  handleAddCandidate,
  handleGetCandidatesByElection,
  handleUpdateCandidate,
  handleDeleteCandidate,
} from "../controllers/candidate.controller.js";
import { uploadCandidateFiles } from "../middlewares/upload.middleware.js";

const candidateRouter = express.Router();

// All routes require authentication
candidateRouter.use(authenticate);

// GET candidates by election (any authenticated user)
candidateRouter.get("/election/:electionId", handleGetCandidatesByElection);

// Middleware to parse JSON fields from FormData (manifesto, social_links)
const parseCandidateData = (req, res, next) => {
  if (req.body.manifesto && typeof req.body.manifesto === "string") {
    try {
      req.body.manifesto = JSON.parse(req.body.manifesto);
    } catch (e) {
      req.body.manifesto = [];
    }
  }
  if (req.body.social_links && typeof req.body.social_links === "string") {
    try {
      req.body.social_links = JSON.parse(req.body.social_links);
    } catch (e) {
      req.body.social_links = {};
    }
  }
  // Convert age to number if it's a string
  if (req.body.age && req.body.age !== "") {
    req.body.age = parseInt(req.body.age, 10);
  }
  next();
};

// POST add candidate (admin/officer only)
candidateRouter.post(
  "/",
  authorize("admin", "officer"),
  uploadCandidateFiles,
  parseCandidateData,
  validate(addCandidateValidation),
  handleAddCandidate,
);

// PUT update candidate (admin/officer only)
candidateRouter.put(
  "/:id",
  authorize("admin", "officer"),
  uploadCandidateFiles,
  parseCandidateData,
  validate(updateCandidateValidation),
  handleUpdateCandidate,
);

// DELETE candidate (admin/officer only)
candidateRouter.delete(
  "/:id",
  authorize("admin", "officer"),
  handleDeleteCandidate,
);

export default candidateRouter;
