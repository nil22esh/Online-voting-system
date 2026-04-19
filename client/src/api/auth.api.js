import api from "./axios";

export const loginUser = (data) => api.post("/auth/login", data);
export const registerUser = (data) => api.post("/auth/register", data);
export const logoutUser = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");
export const refreshToken = () => api.post("/auth/refresh-token");
export const verifyEmail = (token) => api.get(`/auth/verify-email/${token}`);

// Google OAuth — redirect-based, no API call needed
export const googleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1"}/auth/google`;
};
