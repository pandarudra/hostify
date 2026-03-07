import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";
import path from "path";
import { AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_CONTAINER_NAME, AZURE_STORAGE_SAS_TOKEN, } from "../constants/e.js";
/**
 * Creates a BlobServiceClient using the SAS token
 */
function getBlobServiceClient() {
    const accountUrl = `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`;
    return new BlobServiceClient(`${accountUrl}?${AZURE_STORAGE_SAS_TOKEN}`);
}
/**
 * Recursively collect files while ignoring unwanted files
 */
function getAllFiles(dirPath, files = []) {
    const items = fs.readdirSync(dirPath);
    items.forEach((item) => {
        // Ignore git and other unnecessary files
        if (item === ".git" || item === ".gitignore")
            return;
        const filePath = path.join(dirPath, item);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, files);
        }
        else {
            files.push(filePath);
        }
    });
    return files;
}
/**
 * Fix absolute paths in HTML files to work with subfolder hosting
 * Converts paths like src="/script.js" to src="script.js"
 */
function fixHtmlPaths(htmlContent) {
    // Fix src attributes: src="/file" -> src="file"
    htmlContent = htmlContent.replace(/(<(?:script|img|iframe)[^>]+src=["'])\/(?!\/)/gi, "$1");
    // Fix href attributes: href="/file" -> href="file"
    htmlContent = htmlContent.replace(/(<(?:link|a)[^>]+href=["'])\/(?!\/)/gi, "$1");
    // Fix action attributes: action="/path" -> action="path"
    htmlContent = htmlContent.replace(/(<form[^>]+action=["'])\/(?!\/)/gi, "$1");
    return htmlContent;
}
/**
 * Upload a local directory to Azure Blob Storage
 */
export async function uploadDirectoryToBlob(localPath, folderName) {
    try {
        const blobServiceClient = getBlobServiceClient();
        // $web container for static hosting
        const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
        // Ensure container exists with public access
        await containerClient.createIfNotExists({
            access: "blob",
        });
        const files = getAllFiles(localPath);
        console.log(`Uploading ${files.length} files to Azure Blob Storage...`);
        let hasIndexHtml = false;
        for (const filePath of files) {
            const relativePath = path.relative(localPath, filePath);
            const blobName = `${folderName}/${relativePath.replace(/\\/g, "/")}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            const contentType = getContentType(filePath);
            const isHtmlFile = path.extname(filePath).toLowerCase() === ".html";
            // Fix HTML files to use relative paths
            if (isHtmlFile) {
                let htmlContent = fs.readFileSync(filePath, "utf-8");
                htmlContent = fixHtmlPaths(htmlContent);
                const buffer = Buffer.from(htmlContent, "utf-8");
                await blockBlobClient.upload(buffer, buffer.length, {
                    blobHTTPHeaders: {
                        blobContentType: contentType,
                        blobCacheControl: "public, max-age=3600", // Cache HTML for 1 hour
                    },
                });
            }
            else {
                await blockBlobClient.uploadFile(filePath, {
                    blobHTTPHeaders: {
                        blobContentType: contentType,
                        blobCacheControl: "public, max-age=31536000", // Cache for 1 year
                    },
                });
            }
            console.log(`Uploaded: ${blobName}`);
            // Check if index.html exists
            if (relativePath === "index.html" ||
                relativePath.endsWith("/index.html")) {
                hasIndexHtml = true;
            }
        }
        // Return full URL with index.html for proper static website access
        const publicUrl = hasIndexHtml
            ? `https://${AZURE_STORAGE_ACCOUNT_NAME}.z30.web.core.windows.net/${folderName}/index.html`
            : `https://${AZURE_STORAGE_ACCOUNT_NAME}.z30.web.core.windows.net/${folderName}`;
        console.log(`Deployment successful: ${publicUrl}`);
        return publicUrl;
    }
    catch (error) {
        console.error("Error uploading to Azure Blob Storage:", error);
        throw new Error(`Failed to upload to Azure Blob Storage: ${error}`);
    }
}
/**
 * Delete local repo after upload
 */
export function deleteLocalDirectory(localPath) {
    try {
        if (fs.existsSync(localPath)) {
            fs.rmSync(localPath, { recursive: true, force: true });
            console.log(`Deleted local directory: ${localPath}`);
        }
    }
    catch (error) {
        console.error("Error deleting local directory:", error);
        throw new Error(`Failed to delete local directory: ${error}`);
    }
}
/**
 * Detect file content type
 */
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".txt": "text/plain",
        ".md": "text/markdown",
        ".pdf": "application/pdf",
        ".xml": "application/xml",
        ".zip": "application/zip",
    };
    return contentTypes[ext] || "application/octet-stream";
}
//# sourceMappingURL=azureStorage.js.map