import { Router } from "express";
import {
  deployWithAuth,
  deployLegacy,
} from "../controllers/deploy.controllers.js";
import { authenticate } from "../utils/jwt.js";

export const deployRouter = Router();

// New authenticated deploy endpoint (recommended)
deployRouter.post("/", authenticate, deployWithAuth);

// Legacy endpoint for backwards compatibility
deployRouter.post("/legacy", deployLegacy);

/**
 * @swagger
 * /api/v1/deploy:
 *   post:
 *     summary: Deploy a GitHub repository (authenticated)
 *     description: Clones a GitHub repository, uploads it to Azure Blob Storage, creates webhook automatically
 *     tags: [Deployment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeployRequestAuth'
 *           examples:
 *             withSubdomain:
 *               summary: Deploy with custom subdomain
 *               value:
 *                 ghlink: "https://github.com/username/repository.git"
 *                 subdomain: "my-awesome-site"
 *             withoutSubdomain:
 *               summary: Deploy with auto-generated subdomain
 *               value:
 *                 ghlink: "https://github.com/username/repository.git"
 *     responses:
 *       200:
 *         description: Deployment successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeploySuccessResponse'
 *       500:
 *         description: Deployment failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeployErrorResponse'
 */
// Legacy swagger docs kept for reference
deployRouter.post("/deploy", deployLegacy);
