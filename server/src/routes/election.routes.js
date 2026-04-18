import express from "express";
import validate from "../middlewares/validateValidations.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/auth.middleware.js";
import {
  createElectionValidation,
  updateElectionValidation,
} from "../validations/election.validations.js";
import {
  handleCreateElection,
  handleGetAllElections,
  handleGetElectionById,
  handleUpdateElection,
  handleDeleteElection,
} from "../controllers/election.controller.js";

const electionRouter = express.Router();

// All routes require authentication
electionRouter.use(authenticate);

// GET all elections (any authenticated user)
electionRouter.get("/", handleGetAllElections);

// GET election by ID (any authenticated user)
electionRouter.get("/:id", handleGetElectionById);

// POST create election (admin/officer only)
electionRouter.post(
  "/",
  authorize("admin", "officer"),
  validate(createElectionValidation),
  handleCreateElection,
);

// PUT update election (admin/officer only)
electionRouter.put(
  "/:id",
  authorize("admin", "officer"),
  validate(updateElectionValidation),
  handleUpdateElection,
);

// DELETE election (admin only)
electionRouter.delete("/:id", authorize("admin"), handleDeleteElection);

export default electionRouter;
