import { Router } from "express";
import { githubWebhook } from "../controllers/git.controllers.js";

export const gitRouter = Router();

gitRouter.post("/webhook/gh", githubWebhook);
