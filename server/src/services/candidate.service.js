import { pool } from "../db/db.js";

/**
 * Add a candidate to an election
 */
export const addCandidate = async (
  name, 
  partyName, 
  partySymbol, 
  age, 
  gender, 
  education, 
  profession, 
  experienceYears, 
  bio, 
  manifesto, 
  socialLinks, 
  photoUrl, 
  electionId
) => {
  const query = `
    INSERT INTO candidates (
      name, party_name, party_symbol, age, gender, education, 
      profession, experience_years, bio, manifesto, social_links, 
      photo_url, election_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  const result = await pool.query(query, [
    name, 
    partyName, 
    partySymbol, 
    age || null, 
    gender, 
    education, 
    profession, 
    experienceYears, 
    bio, 
    JSON.stringify(manifesto || []), 
    JSON.stringify(socialLinks || {}), 
    photoUrl, 
    electionId
  ]);
  return result.rows[0];
};

/**
 * Get all candidates for an election with vote counts
 */
export const getCandidatesByElection = async (electionId) => {
  const query = `
    SELECT 
      c.*,
      c.party_name as party,
      COALESCE((SELECT COUNT(*) FROM votes v WHERE v.candidate_id = c.id), 0) as vote_count
    FROM candidates c
    WHERE c.election_id = $1
    ORDER BY c.created_at ASC
  `;
  const result = await pool.query(query, [electionId]);
  return result.rows;
};

/**
 * Get candidate by ID
 */
export const getCandidateById = async (id) => {
  const query = `SELECT * FROM candidates WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

/**
 * Update a candidate
 */
export const updateCandidate = async (
  id, 
  name, 
  partyName, 
  partySymbol, 
  age, 
  gender, 
  education, 
  profession, 
  experienceYears, 
  bio, 
  manifesto, 
  socialLinks, 
  photoUrl
) => {
  const query = `
    UPDATE candidates 
    SET 
      name = $1, 
      party_name = $2, 
      party_symbol = $3, 
      age = $4, 
      gender = $5, 
      education = $6, 
      profession = $7, 
      experience_years = $8, 
      bio = $9, 
      manifesto = $10, 
      social_links = $11, 
      photo_url = $12
    WHERE id = $13
    RETURNING *
  `;
  const result = await pool.query(query, [
    name, 
    partyName, 
    partySymbol, 
    age || null, 
    gender, 
    education, 
    profession, 
    experienceYears, 
    bio, 
    JSON.stringify(manifesto || []), 
    JSON.stringify(socialLinks || {}), 
    photoUrl, 
    id
  ]);
  return result.rows[0];
};

/**
 * Delete a candidate
 */
export const deleteCandidate = async (id) => {
  const query = `DELETE FROM candidates WHERE id = $1 RETURNING id`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};
