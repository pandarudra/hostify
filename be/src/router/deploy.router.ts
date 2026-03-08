import { Router } from "express";
import { deploy } from "../controllers/deploy.controllers.js";

export const deployRouter = Router();

/**
 * @swagger
 * /api/v1/deploy:
 *   post:
 *     summary: Deploy a GitHub repository
 *     description: Clones a GitHub repository, uploads it to Azure Blob Storage, and creates a custom subdomain mapping in Cloudflare KV
 *     tags: [Deployment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeployRequest'
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
deployRouter.post("/deploy", deploy);
