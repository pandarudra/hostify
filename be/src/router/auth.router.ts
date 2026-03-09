import { Router } from "express";
import {
  githubLogin,
  githubCallback,
  getCurrentUser,
  logout,
} from "../controllers/auth.controllers.js";
import { authenticate } from "../utils/jwt.js";

export const authRouter = Router();

// OAuth routes
authRouter.get("/github", githubLogin);
authRouter.get("/github/callback", githubCallback);

// Protected routes
authRouter.get("/me", authenticate, getCurrentUser);
authRouter.post("/logout", authenticate, logout);
