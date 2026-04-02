import type { Response } from "express";
import type { AuthRequest } from "../utils/jwt.js";
import { uploadtoServer } from "../helpers/upload.js";
import { User } from "../models/User.js";
import { Deployment } from "../models/Deployment.js";
import { isDBConnected } from "../config/database.js";
import crypto from "crypto";
import { createGitHubWebhook } from "../utils/github.js";
import { getProjectMetadata } from "../utils/cloudflare.js";
import { sendUserNotification } from "../services/notifications.js";
import { incrementUserHeatmap } from "../services/heatmap.js";

/**
 * Verify deployment status - check if subdomain is properly configured
 */
export const verifyDeployment = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const { subdomain: subdomainParam } = req.params;
    const subdomain =
      typeof subdomainParam === "string" ? subdomainParam : subdomainParam?.[0];

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: "Subdomain is required",
      });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    // Check database
    const deployment = await Deployment.findOne({ subdomain });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: "Deployment not found in database",
      });
    }

    // Check Cloudflare KV
    const metadata = await getProjectMetadata(subdomain);

    return res.status(200).json({
      success: true,
      deployment: {
        subdomain: deployment.subdomain,
        status: deployment.status,
        deploymentUrl: deployment.deploymentUrl,
        createdAt: deployment.createdAt,
      },
      cloudflareKV: {
        configured: !!metadata,
        metadata: metadata,
      },
      diagnosis: {
        databaseOk: true,
        cloudflareKvOk: !!metadata,
        expectedUrl: `https://${subdomain}.rudrax.me`,
      },
    });
  } catch (error) {
    console.error("Verify deployment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify deployment",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

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

    // Determine deployment status based on success
    // If upload failed or subdomain wasn't saved, mark as failed
    const deploymentStatus = result.success === false ? "failed" : "active";

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
      status: deploymentStatus,
      deploymentUrl: result.url,
      lastDeployedAt: new Date(),
    });

    await incrementUserHeatmap(user._id);

    const responsePayload = {
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
    };

    try {
      await sendUserNotification({
        userId: user._id.toString(),
        type: "deploy",
        subject: `Deployment ${deploymentStatus === "active" ? "successful" : "failed"}: ${repoName}`,
        text: `Status: ${deploymentStatus}. Repo: ${repoOwner}/${repoName}. URL: ${result.url || "N/A"}.`,
        templateContext: {
          username: user.username,
          details: `Subdomain: ${result.subdomain} • Status: ${deploymentStatus}`,
          ctaUrl:
            result.url ||
            responsePayload.deployment?.url ||
            "https://hostify.app/dash",
        },
        loggerContext: {
          source: "deploy",
          repo: `${repoOwner}/${repoName}`,
          status: deploymentStatus,
          subdomain: result.subdomain,
        },
      });
    } catch (notifyError) {
      console.error("Deploy notification error:", notifyError);
    }

    return res.status(200).json(responsePayload);
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
 * Check if subdomain is available
 */
export const checkSubdomainAvailability = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const { subdomain } = req.query;

    if (!subdomain || typeof subdomain !== "string") {
      return res.status(400).json({
        success: false,
        message: "Subdomain is required",
      });
    }

    // Validate subdomain format (lowercase alphanumeric and hyphens only)
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        success: false,
        available: false,
        message:
          "Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.",
      });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    // Check if subdomain exists
    const existing = await Deployment.findOne({ subdomain });

    return res.status(200).json({
      success: true,
      available: !existing,
      subdomain: subdomain,
      message: existing
        ? "Subdomain is already taken"
        : "Subdomain is available",
    });
  } catch (error) {
    console.error("Check subdomain error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check subdomain availability",
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
