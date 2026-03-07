import { Router } from "express";
import { deploy } from "../controllers/deploy.controllers.js";

export const deployRouter = Router();

deployRouter.post("/deploy", deploy);
