import { wait } from "../utils/general.js";
import { cloneRepo } from "../utils/git.js";
import {
  uploadDirectoryToBlob,
  deleteLocalDirectory,
} from "../utils/azureStorage.js";
import {
  isProd,
  PROD_DEPLOYMENT_URL,
  LOCAL_WEBHOOK_URL,
} from "../constants/e.js";
import {
  saveSubdomain,
  saveProjectMetadata,
  saveWebhookToken,
} from "../utils/cloudflare.js";
import { createGitHubWebhook } from "../utils/github.js";
import crypto from "crypto";

export const clonefromGh = async (ghlink: string) => {
  const res = await cloneRepo(ghlink);
  return res;
};

export const uploadtoServer = async (
  ghlink: string,
  customSubdomain?: string,
  githubToken?: string,
) => {
  try {
    await wait(2000);

    const { folderName, path: localpath } = await cloneRepo(ghlink);

    console.log(`Repository cloned to local path: ${localpath}`);

    // Use custom subdomain if provided, otherwise default to folder name
    const subdomain = customSubdomain || folderName;

    // Generate unique webhook token for this project
    const webhookToken = crypto.randomBytes(32).toString("hex");

    let blobPath = localpath;
    let url = "";

    if (isProd) {
      // Upload project to Azure
      blobPath = await uploadDirectoryToBlob(localpath, folderName);

      // Save complete project metadata to Cloudflare KV
      await saveProjectMetadata({
        subdomain: subdomain,
        folderName: folderName,
        repoUrl: ghlink,
        createdAt: new Date().toISOString(),
        lastDeployedAt: new Date().toISOString(),
        webhookToken: webhookToken,
      });

      // Save webhook token mapping for quick lookup
      await saveWebhookToken(webhookToken, subdomain);

      // Generate public subdomain URL using the subdomain
      url = `https://${subdomain}.rudrax.me`;

      // Remove local files
      deleteLocalDirectory(localpath);

      console.log(`Project deployed: ${url}`);
    } else {
      // Local development - save to KV if configured (optional)
      await saveProjectMetadata({
        subdomain: subdomain,
        folderName: folderName,
        repoUrl: ghlink,
        createdAt: new Date().toISOString(),
        lastDeployedAt: new Date().toISOString(),
        webhookToken: webhookToken,
      });

      // Save webhook token mapping for quick lookup
      await saveWebhookToken(webhookToken, subdomain);

      url = `/local/${folderName}`;
      console.log(`Repository available locally at: ${url}`);
      console.log(`Subdomain '${subdomain}' mapped to folder '${folderName}'`);
      console.log(
        `🔗 Webhook URL: ${LOCAL_WEBHOOK_URL}/api/git/webhook/${webhookToken}`,
      );
    }

    const webhookUrl = isProd
      ? `${PROD_DEPLOYMENT_URL}/api/git/webhook/${webhookToken}`
      : `${LOCAL_WEBHOOK_URL}/api/git/webhook/${webhookToken}`;

    // Automatically create GitHub webhook if token is provided
    let webhookCreated = false;
    let webhookError: string | undefined;

    if (githubToken) {
      console.log("🚀 Auto-creating GitHub webhook...");
      const webhookResult = await createGitHubWebhook({
        repoUrl: ghlink,
        webhookUrl: webhookUrl,
        githubToken: githubToken,
      });

      webhookCreated = webhookResult.success;
      if (!webhookResult.success) {
        webhookError = webhookResult.error;
        console.warn(`⚠️  Webhook auto-creation failed: ${webhookError}`);
      } else {
        console.log(`✅ Webhook auto-created: ${webhookResult.message}`);
      }
    }

    return {
      folderName: folderName,
      subdomain: subdomain,
      path: blobPath,
      url: url,
      webhookToken: webhookToken,
      webhookUrl: webhookUrl,
      webhookAutoCreated: webhookCreated,
      webhookError: webhookError,
    };
  } catch (error) {
    console.error("Error in uploadtoServer:", error);
    throw error;
  }
};
