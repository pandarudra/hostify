import { Router } from "express";
import {
  listRepositories,
  listDeployments,
  getDeployment,
  deleteDeployment,
} from "../controllers/repo.controllers.js";
import { authenticate } from "../utils/jwt.js";

export const repoRouter = Router();

// All routes require authentication
repoRouter.use(authenticate);

// Repository routes
repoRouter.get("/repositories", listRepositories);

// Deployment routes
repoRouter.get("/deployments", listDeployments);
repoRouter.get("/deployments/:id", getDeployment);
repoRouter.delete("/deployments/:id", deleteDeployment);
