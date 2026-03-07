import { uploadtoServer } from "../helpers/upload.js";
export const deploy = async (req, res) => {
    const ghlink = req.body.ghlink;
    if (!ghlink)
        throw new Error("GitHub link is required");
    try {
        const blobPath = await uploadtoServer(ghlink);
        return res.status(200).json({
            success: true,
            message: "Deployment successful",
            blobPath,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Deployment failed",
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
//# sourceMappingURL=deploy.controllers.js.map