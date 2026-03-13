import { Router } from "express";
import {
  getSettings,
  updateSettingsOptimistic,
  initiateTwoFactorSetup,
  verifyTwoFactorSetup,
  disableTwoFactor,
} from "../controllers/settings.controllers.js";
import { authenticate } from "../utils/jwt.js";

export const settingsRouter = Router();

settingsRouter.use(authenticate);
settingsRouter.get("/", getSettings);
settingsRouter.put("/", updateSettingsOptimistic);
settingsRouter.post("/2fa/initiate", initiateTwoFactorSetup);
settingsRouter.post("/2fa/verify", verifyTwoFactorSetup);
settingsRouter.post("/2fa/disable", disableTwoFactor);
