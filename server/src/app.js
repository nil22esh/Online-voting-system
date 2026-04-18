// Import core and third-party middlewares
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import config from "./config/config.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";
import { generalLimiter } from "./middlewares/rateLimit.middleware.js";

// Import route modules
import authRouter from "./routes/auth.routes.js";
import electionRouter from "./routes/election.routes.js";
import candidateRouter from "./routes/candidate.routes.js";
import userRouter from "./routes/user.routes.js";
import voteRouter from "./routes/vote.routes.js";
import auditRouter from "./routes/audit.routes.js";
import chatRouter from "./routes/chat.routes.js";

// Initialize Express application
const app = express();

// Path configuration for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Enable CORS with credentials (for httpOnly cookies)
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Parse incoming JSON requests (limit to 10kb for security)
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded data (form submissions)
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Parse cookies (required for JWT in httpOnly cookies)
app.use(cookieParser());

// Set secure HTTP headers (XSS, clickjacking protection)
app.use(helmet());

// Compress response bodies for performance
app.use(compression());

// HTTP request logger
app.use(morgan("dev"));

// Diagnostic logger
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming Request: ${req.method} ${req.originalUrl}`);
  console.log(`[DEBUG] Request Body:`, JSON.stringify(req.body, null, 2));
  next();
});

// Global rate limiter
app.use("/api/", generalLimiter);

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    message: "OK",
    success: true,
    timestamp: new Date().toISOString(),
  });
});

// =============================================
// API Routes
// =============================================
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/elections", electionRouter);
app.use("/api/v1/candidates", candidateRouter);
app.use("/api/v1/votes", voteRouter);
app.use("/api/v1/audit", auditRouter);
app.use("/api/v1/chat", chatRouter);

// Handle 404 routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
