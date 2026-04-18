import api from "./axios";

export const castVote = (data) => api.post("/votes", data);
export const requestOTP = (phoneNumber) => api.post("/votes/request-otp", { phoneNumber });

export const getElectionResults = (electionId) =>
  api.get(`/votes/results/${electionId}`);
export const checkUserVote = (electionId) =>
  api.get(`/votes/check/${electionId}`);
