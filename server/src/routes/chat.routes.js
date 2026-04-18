import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { handleChat } from "../controllers/chat.controller.js";

const chatRouter = express.Router();

// All chat routes require authentication
chatRouter.use(authenticate);

// POST /api/v1/chat — send a message to the bot
chatRouter.post("/", handleChat);

export default chatRouter;
