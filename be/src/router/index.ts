import { deployRouter } from "./deploy.router.js";
import { gitRouter } from "./git.router.js";
import { authRouter } from "./auth.router.js";
import { repoRouter } from "./repo.router.js";
import { settingsRouter } from "./settings.router.js";
import { notificationsRouter } from "./notifications.router.js";

export const router = {
  deployRouter,
  gitRouter,
  authRouter,
  repoRouter,
  settingsRouter,
  notificationsRouter,
};
