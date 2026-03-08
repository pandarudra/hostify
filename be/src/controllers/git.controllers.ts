import type { Request, Response } from "express";
import crypto from "crypto";
import { uploadtoServer } from "../helpers/upload.js";
import {
  getSubdomainsByRepo,
  getProjectMetadata,
  saveProjectMetadata,
} from "../utils/cloudflare.js";
import { GITHUB_WEBHOOK_SECRET } from "../constants/e.js";

/**
 * Verify GitHub webhook signature for security
 */
function verifyGitHubSignature(
  payload: string,
  signature: string | undefined,
): boolean {
  if (!signature) {
    console.warn("⚠️  No signature provided in webhook request");
    return false;
  }

  // GitHub sends signature in format: sha256=<hash>
  const parts = signature.split("=");
  if (parts.length !== 2) {
    console.warn(`⚠️  Invalid signature format: ${signature}`);
    return false;
  }

  const sigHashAlg = parts[0];
  const sigHash = parts[1];

  if (!sigHash) {
    console.warn("⚠️  No hash found in signature");
    return false;
  }

  if (sigHashAlg !== "sha256") {
    console.warn(`⚠️  Unsupported hash algorithm: ${sigHashAlg}`);
    return false;
  }

  // If no secret is configured, skip verification (in development)
  if (!GITHUB_WEBHOOK_SECRET) {
    console.warn(
      "⚠️  GITHUB_WEBHOOK_SECRET not configured. Skipping signature verification (unsafe for production!)",
    );
    return true;
  }

  // Calculate expected signature
  const hmac = crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest("hex");

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(sigHash), Buffer.from(digest));
}

/**
 * GitHub webhook handler for auto-redeploy on push events
 */
export const githubWebhook = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    // Get raw body for signature verification
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const githubEvent = req.headers["x-github-event"] as string | undefined;

    console.log(`📥 GitHub webhook received: ${githubEvent}`);

    // Verify webhook signature
    const rawBody = JSON.stringify(req.body);
    if (!verifyGitHubSignature(rawBody, signature)) {
      console.error("❌ Invalid webhook signature");
      return res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
    }

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

    // Find all projects associated with this repository
    const subdomains = await getSubdomainsByRepo(repoUrl);

    if (subdomains.length === 0) {
      console.log(`ℹ️  No deployments found for repository: ${repoUrl}`);
      return res.status(200).json({
        success: true,
        message: "No deployments found for this repository",
        repoUrl,
      });
    }

    console.log(
      `🚀 Triggering redeployment for ${subdomains.length} project(s)...`,
    );

    // Redeploy each project
    const results = [];
    for (const subdomain of subdomains) {
      try {
        console.log(`   → Redeploying: ${subdomain}`);

        // Get existing project metadata
        const metadata = await getProjectMetadata(subdomain);
        if (!metadata) {
          console.warn(`   ⚠️  No metadata found for ${subdomain}, skipping`);
          results.push({
            subdomain,
            success: false,
            error: "Metadata not found",
          });
          continue;
        }

        // Trigger redeployment with existing subdomain
        const result = await uploadtoServer(repoUrl, subdomain);

        // Update lastDeployedAt timestamp
        await saveProjectMetadata({
          ...metadata,
          lastDeployedAt: new Date().toISOString(),
        });

        console.log(`   ✅ Successfully redeployed: ${result.url}`);

        results.push({
          subdomain,
          success: true,
          url: result.url,
          folderName: result.folderName,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed to redeploy ${subdomain}:`, errorMessage);
        results.push({
          subdomain,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Summarize results
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `\n✅ Redeployment complete: ${successful} succeeded, ${failed} failed\n`,
    );

    return res.status(200).json({
      success: true,
      message: "Auto-redeploy triggered",
      repoUrl,
      branch,
      pusher,
      commits,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
      },
    });
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
