import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.utils.js";
import config from "../config/config.js";
import { unauthorizedResponse, forbiddenResponse } from "../utils/response.js";

// Verify JWT token and attach user to request
export const authenticate = (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return unauthorizedResponse(res, "Access denied. No token provided.");
    }

    const decoded = verifyToken(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return unauthorizedResponse(
        res,
        "Token expired. Please refresh your session.",
      );
    }
    return unauthorizedResponse(res, "Invalid token.");
  }
};

// Role-based access control middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, "Authentication required.");
    }

    if (!roles.includes(req.user.role)) {
      return forbiddenResponse(
        res,
        `Access denied. Required role(s): ${roles.join(", ")}`,
      );
    }

    next();
  };
};
