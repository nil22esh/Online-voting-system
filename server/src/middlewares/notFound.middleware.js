import { notFoundResponse } from "../utils/response.js";

// Handle undefined routes
const notFound = (req, res, next) => {
  console.log(`[DEBUG] Not Found Middleware Triggered for: ${req.method} ${req.originalUrl}`);
  return notFoundResponse(res, `Route ${req.originalUrl} not found`);
};

export default notFound;
