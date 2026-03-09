import { Router } from "express";
import { githubWebhook } from "../controllers/git.controllers.js";

export const gitRouter = Router();

// Token-based webhook endpoint - each project gets a unique URL
gitRouter.post("/webhook/:token", githubWebhook);
