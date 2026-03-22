// Import core and third-party middlewares
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

// Initialize Express application
const app = express();

// Enable Cross-Origin Resource Sharing
// Allows frontend (React) to communicate with backend
app.use(cors());

// Parse incoming JSON requests
// Limit set to 10kb to prevent large payload attacks (security best practice)
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded data (form submissions)
// extended: true allows nested objects
// Limit also set for security
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Parse cookies attached to client requests
// Required for handling JWT in cookies or session-based auth
app.use(cookieParser());

// Set secure HTTP headers
// Protects against common vulnerabilities (XSS, clickjacking, etc.)
app.use(helmet());

// Compress response bodies
// Improves performance by reducing response size
app.use(compression());

// HTTP request logger
// Logs method, URL, status, and response time in development
app.use(morgan("development"));

// Export configured app
export default app;
