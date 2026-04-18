import api from "./axios";

export const getCandidatesByElection = (electionId) =>
  api.get(`/candidates/election/${electionId}`);
export const addCandidate = (data) => api.post("/candidates", data);
export const updateCandidate = (id, data) => api.put(`/candidates/${id}`, data);
export const deleteCandidate = (id) => api.delete(`/candidates/${id}`);
