import { Router } from "express";
export const mainRouter = Router();
mainRouter.post("/deploy", (req, res) => {
    res.json({ message: "Deploy endpoint hit!" });
});
//# sourceMappingURL=main.router.js.map