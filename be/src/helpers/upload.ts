import { wait } from "../utils/general.js";
import { cloneRepo } from "../utils/git.js";
import {
  uploadDirectoryToBlob,
  deleteLocalDirectory,
} from "../utils/azureStorage.js";
import { isProd } from "../constants/e.js";
import { saveSubdomain, saveProjectMetadata } from "../utils/cloudflare.js";

export const clonefromGh = async (ghlink: string) => {
  const res = await cloneRepo(ghlink);
  return res;
};

export const uploadtoServer = async (
  ghlink: string,
  customSubdomain?: string,
) => {
  try {
    await wait(2000);

    const { folderName, path: localpath } = await cloneRepo(ghlink);

    console.log(`Repository cloned to local path: ${localpath}`);

    // Use custom subdomain if provided, otherwise default to folder name
    const subdomain = customSubdomain || folderName;

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
      });

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
      });
      url = `/local/${folderName}`;
      console.log(`Repository available locally at: ${url}`);
      console.log(`Subdomain '${subdomain}' mapped to folder '${folderName}'`);
    }

    return {
      folderName: folderName,
      subdomain: subdomain,
      path: blobPath,
      url: url,
    };
  } catch (error) {
    console.error("Error in uploadtoServer:", error);
    throw error;
  }
};
