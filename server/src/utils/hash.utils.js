import crypto from "crypto";

/**
 * Generate a SHA-256 hash for a vote to ensure integrity.
 * The hash includes the userId, candidateId, and the hash of the previous vote in the chain.
 * 
 * @param {string} userId - ID of the voter
 * @param {string} candidateId - ID of the candidate voted for
 * @param {string} previousHash - Hash of the previous vote (or a seed for the first vote)
 * @returns {string} SHA-256 hash
 */
export const generateVoteHash = (userId, candidateId, previousHash) => {
  const data = `${userId}:${candidateId}:${previousHash || "GENESIS_HASH"}`;
  return crypto.createHash("sha256").update(data).digest("hex");
};

/**
 * Verify a vote hash against the provided data and previous hash.
 * 
 * @param {string} hash - The hash to verify
 * @param {string} userId - ID of the voter
 * @param {string} candidateId - ID of the candidate voted for
 * @param {string} previousHash - Hash of the previous vote
 * @returns {boolean} True if hash matches
 */
export const verifyVoteIntegrity = (hash, userId, candidateId, previousHash) => {
  const recalculatedHash = generateVoteHash(userId, candidateId, previousHash);
  return hash === recalculatedHash;
};
