import { wait } from "../utils/general.js";
import { cloneRepo } from "../utils/git.js";
import {
  uploadDirectoryToBlob,
  deleteLocalDirectory,
} from "../utils/azureStorage.js";

export const clonefromGh = async (ghlink: string) => {
  const res = await cloneRepo(ghlink);
  return res;
};

export const uploadtoServer = async (ghlink: string) => {
  try {
    // Clone repository to local storage
    await wait(2000); // simulate upload time
    const { folderName, path: localpath } = await cloneRepo(ghlink);

    console.log(`Repository cloned to local path: ${localpath}`);

    // Upload to Azure Blob Storage
    const blobPath = await uploadDirectoryToBlob(localpath, folderName);

    // Delete local folder after successful upload
    deleteLocalDirectory(localpath);

    console.log(
      `File uploaded to Azure Blob Storage: ${ghlink} in folder ${folderName}`,
    );
    console.log(`Local folder deleted: ${localpath}`);

    return {
      folderName: folderName,
      path: blobPath,
    };
  } catch (error) {
    console.error("Error in uploadtoServer:", error);
    throw error;
  }
};
