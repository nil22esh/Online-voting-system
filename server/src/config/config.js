import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT || 8080,
  environment: process.env.ENVIRONMENT || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwt: {
    secret: process.env.JWT_SECRET || "super-secret-key-change-in-production",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "super-refresh-secret-key-change-in-production",
    accessExpiry: "15m",
    refreshExpiry: "7d",
    refreshExpiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
  db: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    name: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
  },
  cookies: {
    httpOnly: true,
    secure: process.env.ENVIRONMENT === "production",
    sameSite: process.env.ENVIRONMENT === "production" ? "strict" : "lax",
    accessMaxAge: 15 * 60 * 1000, // 15 minutes
    refreshMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || '"Online Voting System" <noreply@ovs.com>',
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
};
