import { pool } from "../db/db.js";
import { generateVoteHash } from "../utils/hash.utils.js";
import logger from "../utils/logger.js";

/**
 * Cast a vote (with transaction for concurrency safety)
 */
export const castVote = async (
  userId,
  electionId,
  candidateId,
  ipAddress,
  userAgent,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Lock the election row to prevent race conditions
    const electionCheck = await client.query(
      `SELECT id, status FROM elections WHERE id = $1 FOR UPDATE`,
      [electionId],
    );

    if (!electionCheck.rows[0]) {
      throw new Error("Election not found");
    }

    if (electionCheck.rows[0].status !== "active") {
      throw new Error("Election is not currently active");
    }

    // Fraud Detection: Temporarily disabled due to missing ip_address column in DB
    /*
    const ipCheck = await client.query(
      `SELECT COUNT(*) FROM votes WHERE ip_address = $1 AND voted_at > NOW() - INTERVAL '1 hour'`,
      [ipAddress]
    );
    
    if (parseInt(ipCheck.rows[0].count) > 50) {
      logger.warn(`Fraud Detection: Suspicious activity from IP ${ipAddress}. Threshold exceeded.`);
    }
    */

    // 3. Check if user already voted (within transaction)
    const existingVote = await client.query(
      `SELECT id FROM votes WHERE user_id = $1 AND election_id = $2`,
      [userId, electionId],
    );

    if (existingVote.rows[0]) {
      throw new Error("You have already voted in this election");
    }

    // 4. Verify candidate belongs to this election
    const candidateCheck = await client.query(
      `SELECT id FROM candidates WHERE id = $1 AND election_id = $2`,
      [candidateId, electionId],
    );

    if (!candidateCheck.rows[0]) {
      throw new Error("Candidate not found in this election");
    }

    // 5. Blockchain-like Integrity: Get previous vote hash for chaining
    const prevVoteCheck = await client.query(
      `SELECT vote_hash FROM votes WHERE election_id = $1 ORDER BY voted_at DESC LIMIT 1`,
      [electionId],
    );

    const previousHash = prevVoteCheck.rows[0]?.vote_hash || "GENESIS_BLOCK";
    const voteHash = generateVoteHash(userId, candidateId, previousHash);

    // 6. Insert vote with extra metadata (ip_address and user_agent removed to match current DB schema)
    const voteResult = await client.query(
      `INSERT INTO votes (user_id, election_id, candidate_id, vote_hash, previous_vote_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, election_id, candidate_id, voted_at, vote_hash`,
      [userId, electionId, candidateId, voteHash, previousHash],
    );

    await client.query("COMMIT");
    return voteResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get vote results for an election (aggregated by candidate)
 */
export const getElectionResults = async (electionId) => {
  const query = `
    SELECT 
      c.id as candidate_id,
      c.name as candidate_name,
      c.party_name as party,
      c.photo_url,
      COUNT(v.id)::INTEGER as vote_count
    FROM candidates c
    LEFT JOIN votes v ON v.candidate_id = c.id
    WHERE c.election_id = $1
    GROUP BY c.id, c.name, c.party_name, c.photo_url
    ORDER BY vote_count DESC
  `;
  const result = await pool.query(query, [electionId]);
  return result.rows;
};

/**
 * Verify a vote by its hash
 */
export const verifyVoteByHash = async (hash) => {
  const query = `
    SELECT 
      v.id, v.voted_at, v.previous_vote_hash, v.vote_hash,
      e.title as election_title,
      encode(sha256(v.candidate_id::text::bytea), 'hex') as candidate_hash_ref
    FROM votes v
    JOIN elections e ON v.election_id = e.id
    WHERE v.vote_hash = $1
  `;
  const result = await pool.query(query, [hash]);
  return result.rows[0];
};

/**
 * Check if a user has already voted in an election
 */
export const checkUserVote = async (userId, electionId) => {
  const query = `
    SELECT v.id, v.candidate_id, c.name as candidate_name
    FROM votes v
    JOIN candidates c ON v.candidate_id = c.id
    WHERE v.user_id = $1 AND v.election_id = $2
  `;
  const result = await pool.query(query, [userId, electionId]);
  return result.rows[0];
};

/**
 * Get total vote count for an election
 */
export const getTotalVotes = async (electionId) => {
  const query = `SELECT COUNT(*) as total FROM votes WHERE election_id = $1`;
  const result = await pool.query(query, [electionId]);
  return parseInt(result.rows[0].total);
};

/**
 * Get the winner(s) of a completed election
 * Returns array — multiple entries if there is a tie
 */
export const getElectionWinner = async (electionId) => {
  const query = `
    WITH vote_counts AS (
      SELECT 
        c.id as candidate_id,
        c.name as candidate_name,
        c.party_name,
        c.photo_url,
        COUNT(v.id)::INTEGER as vote_count
      FROM candidates c
      LEFT JOIN votes v ON v.candidate_id = c.id
      WHERE c.election_id = $1
      GROUP BY c.id, c.name, c.party_name, c.photo_url
    ),
    max_votes AS (
      SELECT MAX(vote_count) as max_count FROM vote_counts
    )
    SELECT vc.*, mv.max_count,
      ROUND(vc.vote_count * 100.0 / NULLIF((SELECT COUNT(*) FROM votes WHERE election_id = $1), 0), 1) as vote_percentage
    FROM vote_counts vc, max_votes mv
    WHERE vc.vote_count = mv.max_count
    ORDER BY vc.candidate_name
  `;
  const result = await pool.query(query, [electionId]);
  return result.rows;
};
