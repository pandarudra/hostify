import type { Response } from "express";
import type { AuthRequest } from "../utils/jwt.js";
import { uploadtoServer } from "../helpers/upload.js";
import { User } from "../models/User.js";
import { Deployment } from "../models/Deployment.js";
import { isDBConnected } from "../config/database.js";
import crypto from "crypto";
import { createGitHubWebhook } from "../utils/github.js";

/**
 * Deploy with authentication - automatic token from logged-in user
 */
export const deployWithAuth = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login first.",
      });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    const { repoUrl, subdomain, branch = "main" } = req.body;

    if (!repoUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    // Get user with access token
    const user = await User.findById(req.user.userId).select("+accessToken");

    if (!user || !user.accessToken) {
      return res.status(404).json({
        success: false,
        message: "User not found or no access token",
      });
    }

    // Parse repo info
    const repoMatch = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (!repoMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub repository URL",
      });
    }

    const repoOwner = repoMatch[1];
    const repoName = repoMatch[2];

    // Check if subdomain already exists
    if (subdomain) {
      const existing = await Deployment.findOne({ subdomain });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Subdomain already exists. Please choose a different one.",
        });
      }
    }

    // Deploy the project (uses user's GitHub token automatically)
    const result = await uploadtoServer(repoUrl, subdomain, user.accessToken);

    // Create webhook automatically with user's token
    const webhookResult = await createGitHubWebhook({
      repoUrl,
      webhookUrl: result.webhookUrl,
      githubToken: user.accessToken,
    });

    // Save deployment to database
    const deployment = await Deployment.create({
      userId: user._id,
      subdomain: result.subdomain,
      repoUrl: repoUrl,
      repoName: repoName,
      repoOwner: repoOwner,
      branch: branch,
      folderName: result.folderName,
      webhookToken: result.webhookToken,
      ...(webhookResult.webhookId && { webhookId: webhookResult.webhookId }),
      status: "active",
      deploymentUrl: result.url,
      lastDeployedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Deployment successful",
      deployment: {
        id: (deployment as any)._id,
        subdomain: result.subdomain,
        repoName: repoName,
        repoOwner: repoOwner,
        url: result.url,
        webhookUrl: result.webhookUrl,
        webhookAutoCreated: webhookResult.success,
        createdAt: (deployment as any).createdAt,
      },
      webhookInfo: {
        autoCreated: webhookResult.success,
        message: webhookResult.message,
        error: webhookResult.error,
      },
    });
  } catch (error) {
    console.error("Deploy with auth error:", error);
    return res.status(500).json({
      success: false,
      message: "Deployment failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Legacy deploy endpoint (without authentication)
 * Kept for backwards compatibility
 */
export const deployLegacy = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  const ghlink = req.body.ghlink;
  const customSubdomain = req.body.subdomain;
  const githubToken = req.body.githubToken;

  if (!ghlink) {
    return res.status(400).json({
      success: false,
      message: "GitHub link is required",
    });
  }

  try {
    const result = await uploadtoServer(ghlink, customSubdomain, githubToken);

    return res.status(200).json({
      success: true,
      message: "Deployment successful",
      data: result,
      webhookInfo: {
        autoCreated: result.webhookAutoCreated,
        url: result.webhookUrl,
        error: result.webhookError,
        instruction: result.webhookAutoCreated
          ? "✅ Webhook automatically created in your GitHub repository"
          : githubToken
            ? `⚠️ Webhook creation failed: ${result.webhookError}. You may need to add it manually.`
            : "ℹ️ To use the new authenticated flow, login with GitHub first",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Deployment failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
