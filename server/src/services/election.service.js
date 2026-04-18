import { pool } from "../db/db.js";

/**
 * Create a new election
 */
export const createElection = async (title, description, startTime, endTime, createdBy, isAnonymous = false, electionLevel = 'local') => {
  const query = `
    INSERT INTO elections (title, description, start_time, end_time, created_by, is_anonymous, election_level)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const result = await pool.query(query, [title, description, startTime, endTime, createdBy, isAnonymous, electionLevel]);
  return result.rows[0];
};

/**
 * Get all elections with creator info and candidate/vote counts
 */
export const getAllElections = async () => {
  const query = `
    SELECT 
      e.*,
      u.name as creator_name,
      (SELECT COUNT(*) FROM candidates c WHERE c.election_id = e.id) as candidate_count,
      (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.id) as total_votes
    FROM elections e
    JOIN users u ON e.created_by = u.id
    ORDER BY e.created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Get election by ID with full details
 */
export const getElectionById = async (id) => {
  const query = `
    SELECT 
      e.*,
      u.name as creator_name,
      (SELECT COUNT(*) FROM candidates c WHERE c.election_id = e.id) as candidate_count,
      (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.id) as total_votes
    FROM elections e
    JOIN users u ON e.created_by = u.id
    WHERE e.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

/**
 * Update an election
 */
export const updateElection = async (id, title, description, startTime, endTime, status, isAnonymous, electionLevel, resultsPublished) => {
  const query = `
    UPDATE elections 
    SET title = $1, description = $2, start_time = $3, end_time = $4, status = $5, is_anonymous = $6, election_level = $7, results_published = $8
    WHERE id = $9
    RETURNING *
  `;
  const result = await pool.query(query, [title, description, startTime, endTime, status, isAnonymous, electionLevel, resultsPublished, id]);
  return result.rows[0];
};

/**
 * Delete an election
 */
export const deleteElection = async (id) => {
  const query = `DELETE FROM elections WHERE id = $1 RETURNING id`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

/**
 * Auto-update election statuses based on current time
 */
export const updateElectionStatuses = async () => {
  // Activate elections whose start_time has passed
  await pool.query(`
    UPDATE elections SET status = 'active'
    WHERE status = 'upcoming' AND start_time <= NOW()
  `);

  // Complete elections whose end_time has passed
  await pool.query(`
    UPDATE elections SET status = 'completed'
    WHERE status = 'active' AND end_time <= NOW()
  `);
};
