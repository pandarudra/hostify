import { Router } from "express";
import {
  getSettings,
  updateSettingsOptimistic,
} from "../controllers/settings.controllers.js";
import { authenticate } from "../utils/jwt.js";

export const settingsRouter = Router();

settingsRouter.use(authenticate);
settingsRouter.get("/", getSettings);
settingsRouter.put("/", updateSettingsOptimistic);
