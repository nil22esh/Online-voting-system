import { createClient } from "redis";
import logger from "../utils/logger.js";
import config from "./config.js";

const redisClient = createClient({
  url: config.redis.url,
  socket: {
    tls: true,
    rejectUnauthorized: false,
  },
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));
redisClient.on("connect", () => logger.info("Redis connected successfully"));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export default redisClient;
