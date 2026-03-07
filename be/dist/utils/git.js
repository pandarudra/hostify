import { simpleGit } from "simple-git";
import path from "path";
import fs from "fs";
import { uploadDir } from "../constants/e.js";
import { nanoid } from "nanoid";
const git = simpleGit();
// parse name from github repo link
const parseName = (url) => {
    return url.split("/").pop()?.replace(".git", "");
};
const getfolderName = (repoName) => {
    const uniqueSuffix = nanoid(6);
    const folderName = `${repoName}-${uniqueSuffix}`;
    return folderName;
};
// clone and return path to the cloned repo
export async function cloneRepo(repoUrl) {
    const repoName = parseName(repoUrl);
    if (!repoName)
        throw new Error("Invalid repo url");
    const folderName = getfolderName(repoName);
    const targetDir = path.join(process.cwd(), uploadDir, folderName);
    if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
    }
    await git.clone(repoUrl, targetDir);
    return {
        folderName: folderName,
        path: targetDir,
    };
}
//# sourceMappingURL=git.js.map