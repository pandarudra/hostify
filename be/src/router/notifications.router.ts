import { Router } from "express";
import { sendNotificationEmail } from "../controllers/notifications.controllers.js";
import { authenticate } from "../utils/jwt.js";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);
notificationsRouter.post("/email", sendNotificationEmail);
