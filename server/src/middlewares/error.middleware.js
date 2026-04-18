import { errorResponse } from "../utils/response.js";

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return errorResponse(
    res,
    err.message || "Internal Server Error", // Error message
    statusCode,
    process.env.NODE_ENV === "development" ? err.stack : null, // Show stack only in dev
  );
};

export default errorHandler;
