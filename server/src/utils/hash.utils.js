import crypto from "crypto";

// Generate SHA-256 hash for vote integrity
export const generateVoteHash = (userId, candidateId, previousHash) => {
  const data = `${userId}:${candidateId}:${previousHash || "GENESIS_HASH"}`;
  return crypto.createHash("sha256").update(data).digest("hex");
};

// Verify vote integrity using hash comparison
export const verifyVoteIntegrity = (
  hash,
  userId,
  candidateId,
  previousHash,
) => {
  const recalculatedHash = generateVoteHash(userId, candidateId, previousHash);
  return hash === recalculatedHash;
};
