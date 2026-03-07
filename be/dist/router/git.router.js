import { Router } from "express";
export const gitRouter = Router();
gitRouter.post("/clone", (req, res) => {
    res.json({ message: "Clone endpoint hit!" });
});
//# sourceMappingURL=git.router.js.map