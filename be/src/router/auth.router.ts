import { Router } from "express";
import {
  githubLogin,
  githubCallback,
  getCurrentUser,
  logout,
  verifyTwoFactorLogin,
} from "../controllers/auth.controllers.js";
import {
  authenticate,
  authenticateAllowTwoFactorPending,
} from "../utils/jwt.js";

export const authRouter = Router();

// OAuth routes
authRouter.get("/github", githubLogin);
authRouter.get("/github/callback", githubCallback);

// Protected routes
authRouter.get("/me", authenticate, getCurrentUser);
authRouter.post("/logout", authenticate, logout);
authRouter.post(
  "/2fa/verify",
  authenticateAllowTwoFactorPending,
  verifyTwoFactorLogin,
);
