// Send success response
export const successResponse = (
  res,
  data = {},
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true, // Indicates successful request
    message, // Success message
    data, // Response payload
  });
};

// Send error response
export const errorResponse = (
  res,
  message = "Something went wrong",
  statusCode = 500,
  error = null,
) => {
  return res.status(statusCode).json({
    success: false, // Indicates failed request
    message, // Error message
    error, // Optional error details (for debugging)
  });
};

// Send validation error response
export const validationErrorResponse = (
  res,
  message = "Validation error",
  errors = [],
  statusCode = 400,
) => {
  return res.status(statusCode).json({
    success: false, // Indicates validation failure
    message, // Validation message
    errors, // List of validation errors
  });
};

// Send unauthorized response
export const unauthorizedResponse = (
  res,
  message = "Unauthorized",
  statusCode = 401,
) => {
  return res.status(statusCode).json({
    success: false, // Indicates auth failure
    message, // Unauthorized message
  });
};

// Send forbidden response
export const forbiddenResponse = (
  res,
  message = "Forbidden",
  statusCode = 403,
) => {
  return res.status(statusCode).json({
    success: false, // Indicates access denied
    message, // Forbidden message
  });
};

// Send not found response
export const notFoundResponse = (
  res,
  message = "Resource not found",
  statusCode = 404,
) => {
  return res.status(statusCode).json({
    success: false, // Indicates resource not found
    message, // Not found message
  });
};
