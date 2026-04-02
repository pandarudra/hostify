import type { Request, Response } from "express";
import { uploadtoServer } from "../helpers/upload.js";
import { Deployment } from "../models/Deployment.js";
import { incrementUserHeatmap } from "../services/heatmap.js";
import {
  getProjectByWebhookToken,
  saveProjectMetadata,
} from "../utils/cloudflare.js";

/**
 * GitHub webhook handler for auto-redeploy on push events
 * Uses token-based authentication - each project gets a unique webhook URL
 */
export const githubWebhook = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const webhookToken = req.params.token as string;
    const githubEvent = req.headers["x-github-event"] as string | undefined;

    console.log(`📥 GitHub webhook received: ${githubEvent}`);

    // Verify webhook token and get project
    if (!webhookToken) {
      console.error("❌ No webhook token provided");
      return res.status(401).json({
        success: false,
        message: "No webhook token provided",
      });
    }

    const project = await getProjectByWebhookToken(webhookToken);
    if (!project) {
      console.error("❌ Invalid webhook token");
      return res.status(401).json({
        success: false,
        message: "Invalid webhook token",
      });
    }

    console.log(`✅ Authenticated webhook for project: ${project.subdomain}`);

    // Validate payload
    if (!req.body || !req.body.repository) {
      console.error("❌ Missing repository data in webhook payload");
      return res.status(400).json({
        success: false,
        message: "Missing repository data",
      });
    }

    // Only process push events
    if (githubEvent !== "push") {
      console.log(`ℹ️  Ignoring ${githubEvent} event`);
      return res.status(200).json({
        success: true,
        message: `Event ${githubEvent} ignored`,
      });
    }

    // Parse webhook payload
    const repoUrl = req.body.repository.clone_url;
    const branch = req.body.ref?.replace("refs/heads/", "") || "main";
    const pusher = req.body.pusher?.name || "unknown";
    const commits = req.body.commits?.length || 0;

    console.log(`🔔 Push detected:`);
    console.log(`   Repository: ${repoUrl}`);
    console.log(`   Branch: ${branch}`);
    console.log(`   Pusher: ${pusher}`);
    console.log(`   Commits: ${commits}`);

    // Verify the webhook is for the correct repository
    if (project.repoUrl !== repoUrl) {
      console.warn(
        `⚠️  Repository mismatch. Expected ${project.repoUrl}, got ${repoUrl}`,
      );
      return res.status(400).json({
        success: false,
        message: "Repository mismatch",
        expected: project.repoUrl,
        received: repoUrl,
      });
    }

    console.log(`🚀 Triggering redeployment for project: ${project.subdomain}`);

    try {
      // Trigger redeployment with existing subdomain
      const result = await uploadtoServer(repoUrl, project.subdomain);

      // Update metadata with new folder name and timestamp (preserve webhookToken)
      await saveProjectMetadata({
        ...project,
        folderName: result.folderName, // ✅ Update to new folder name
        lastDeployedAt: new Date().toISOString(),
      });

      const deployment = await Deployment.findOneAndUpdate(
        { subdomain: project.subdomain },
        {
          $set: {
            folderName: result.folderName,
            deploymentUrl: result.url,
            lastDeployedAt: new Date(),
            status: "active",
          },
        },
        { new: true },
      ).select("userId");

      if (deployment?.userId) {
        await incrementUserHeatmap(deployment.userId);
      }

      console.log(`   ✅ Successfully redeployed: ${result.url}`);

      return res.status(200).json({
        success: true,
        message: "Auto-redeploy triggered",
        repoUrl,
        branch,
        pusher,
        commits,
        subdomain: project.subdomain,
        url: result.url,
        folderName: result.folderName,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Failed to redeploy ${project.subdomain}:`,
        errorMessage,
      );
      return res.status(500).json({
        success: false,
        message: "Redeployment failed",
        error: errorMessage,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error processing webhook:", errorMessage);
    return res.status(500).json({
      success: false,
      message: "Error processing webhook",
      error: errorMessage,
    });
  }
};
