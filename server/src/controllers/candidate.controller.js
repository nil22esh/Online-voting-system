import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  addCandidate,
  getCandidatesByElection,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} from "../services/candidate.service.js";
import { getElectionById } from "../services/election.service.js";
import { createAuditLog } from "../services/audit.service.js";
import { successResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";
import redisClient from "../config/redis.js";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Add a candidate to an election
 * POST /api/v1/candidates
 * Access: admin, officer
 */
export const handleAddCandidate = asyncHandler(async (req, res) => {
  const { 
    name, party_name, party_symbol, age, gender, education, 
    profession, experience_years, bio, manifesto, social_links, 
    photo_url, election_id 
  } = req.body;

  // Verify election exists
  const election = await getElectionById(election_id);
  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  // Cannot add candidates to completed or cancelled elections
  if (election.status === "completed" || election.status === "cancelled") {
    throw new ApiError(400, "Cannot add candidates to a completed or cancelled election");
  }

  // Handle uploaded file paths
  let finalPhotoUrl = photo_url;
  let finalPartySymbol = party_symbol;

  if (req.files) {
    if (req.files["photo"] && req.files["photo"][0]) {
      finalPhotoUrl = req.files["photo"][0].path;
    }
    if (req.files["party_symbol_file"] && req.files["party_symbol_file"][0]) {
      finalPartySymbol = req.files["party_symbol_file"][0].path;
    }
  }

  const candidate = await addCandidate(
    name, 
    party_name, 
    finalPartySymbol, 
    age, 
    gender, 
    education, 
    profession, 
    experience_years, 
    bio, 
    manifesto, 
    social_links, 
    finalPhotoUrl, 
    election_id
  );

  // Audit log
  await createAuditLog(
    req.user.id,
    "ADD_CANDIDATE",
    "candidate",
    candidate.id,
    { name, election_id },
    req.ip,
  );

  // Invalidate elections list cache since candidate count changed
  await redisClient.del("elections:all");

  return successResponse(res, candidate, "Candidate added successfully", 201);
});

/**
 * Get all candidates for an election
 * GET /api/v1/candidates/election/:electionId
 * Access: all authenticated users
 */
export const handleGetCandidatesByElection = asyncHandler(async (req, res) => {
  const candidates = await getCandidatesByElection(req.params.electionId);
  return successResponse(res, candidates, "Candidates fetched successfully", 200);
});

/**
 * Update a candidate
 * PUT /api/v1/candidates/:id
 * Access: admin, officer
 */
export const handleUpdateCandidate = asyncHandler(async (req, res) => {
  const existing = await getCandidateById(req.params.id);

  if (!existing) {
    throw new ApiError(404, "Candidate not found");
  }

  const { 
    name, party_name, party_symbol, age, gender, education, 
    profession, experience_years, bio, manifesto, social_links, 
    photo_url 
  } = req.body;

  let finalPhotoUrl = photo_url !== undefined ? photo_url : existing.photo_url;
  let finalPartySymbol = party_symbol !== undefined ? party_symbol : existing.party_symbol;

  // If a new file was uploaded
  if (req.files) {
    if (req.files["photo"] && req.files["photo"][0]) {
      finalPhotoUrl = req.files["photo"][0].path;

      // DELETE OLD FILE (if it was a Cloudinary upload)
      if (existing.photo_url && existing.photo_url.includes("cloudinary.com")) {
        try {
          const urlParts = existing.photo_url.split("/");
          const uploadIndex = urlParts.findIndex(part => part === "upload");
          const publicIdWithExt = urlParts.slice(uploadIndex + 2).join("/");
          const publicId = publicIdWithExt.split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Cloudinary delete error:", err);
        }
      }
    }

    if (req.files["party_symbol_file"] && req.files["party_symbol_file"][0]) {
      finalPartySymbol = req.files["party_symbol_file"][0].path;

      // DELETE OLD SYMBOL FILE
      if (existing.party_symbol && existing.party_symbol.includes("cloudinary.com")) {
        try {
          const urlParts = existing.party_symbol.split("/");
          const uploadIndex = urlParts.findIndex(part => part === "upload");
          const publicIdWithExt = urlParts.slice(uploadIndex + 2).join("/");
          const publicId = publicIdWithExt.split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Cloudinary delete error:", err);
        }
      }
    }
  }

  const updated = await updateCandidate(
    req.params.id,
    name || existing.name,
    party_name !== undefined ? party_name : existing.party_name,
    finalPartySymbol !== undefined ? finalPartySymbol : existing.party_symbol,
    age !== undefined ? age : existing.age,
    gender !== undefined ? gender : existing.gender,
    education !== undefined ? education : existing.education,
    profession !== undefined ? profession : existing.profession,
    experience_years !== undefined ? experience_years : existing.experience_years,
    bio !== undefined ? bio : existing.bio,
    manifesto !== undefined ? manifesto : existing.manifesto,
    social_links !== undefined ? social_links : existing.social_links,
    finalPhotoUrl,
  );

  // Audit log
  await createAuditLog(
    req.user.id,
    "UPDATE_CANDIDATE",
    "candidate",
    req.params.id,
    { name: updated.name },
    req.ip,
  );

  // Invalidate elections list cache since candidate details might have changed
  await redisClient.del("elections:all");

  return successResponse(res, updated, "Candidate updated successfully", 200);
});

/**
 * Delete a candidate
 * DELETE /api/v1/candidates/:id
 * Access: admin, officer
 */
export const handleDeleteCandidate = asyncHandler(async (req, res) => {
  const existing = await getCandidateById(req.params.id);

  if (!existing) {
    throw new ApiError(404, "Candidate not found");
  }

  // DELETE FILE (if it was a Cloudinary upload)
  if (existing.photo_url && existing.photo_url.includes("cloudinary.com")) {
    try {
      const urlParts = existing.photo_url.split("/");
      const uploadIndex = urlParts.findIndex(part => part === "upload");
      const publicIdWithExt = urlParts.slice(uploadIndex + 2).join("/");
      const publicId = publicIdWithExt.split(".")[0];
      
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error("Cloudinary delete error:", err);
    }
  }

  await deleteCandidate(req.params.id);

  // Audit log
  await createAuditLog(
    req.user.id,
    "DELETE_CANDIDATE",
    "candidate",
    req.params.id,
    { name: existing.name },
    req.ip,
  );

  // Invalidate elections list cache since candidate count changed
  await redisClient.del("elections:all");

  return successResponse(res, null, "Candidate deleted successfully", 200);
});
