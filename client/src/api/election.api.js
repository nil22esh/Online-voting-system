import api from "./axios";

export const getAllElections = () => api.get("/elections");
export const getElectionById = (id) => api.get(`/elections/${id}`);
export const createElection = (data) => api.post("/elections", data);
export const updateElection = (id, data) => api.put(`/elections/${id}`, data);
export const deleteElection = (id) => api.delete(`/elections/${id}`);
