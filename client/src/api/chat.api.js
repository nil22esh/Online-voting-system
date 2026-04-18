import api from "./axios";

export const sendChatMessage = (message) =>
  api.post("/chat", { message });
