// Custom API Error class
export default class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = "") {
    super(message); // Call parent constructor

    this.statusCode = statusCode; // HTTP status code
    this.success = false; // Always false for errors
    this.errors = errors; // Additional error details

    // Capture stack trace for debugging
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
