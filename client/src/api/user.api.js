import api from "./axios";

export const getAllUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.patch(`/users/${userId}/role`, { role });
  return response.data;
};

export const updateUserStatus = async (userId, is_active) => {
  const response = await api.patch(`/users/${userId}/status`, { is_active });
  return response.data;
};
