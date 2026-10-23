import { Router } from "express";
import { RainbowIdentityProvider } from "../auth/rainbow-identity-provider.adapter";
import { requireAuth } from "../auth/require-auth.middleware";
import { listMyNotificationsHandler } from "./queries/list-my-notifications/list-my-notifications.http.controller";

const identityProvider = new RainbowIdentityProvider();

export const notificationRouter = Router();

notificationRouter.get("/", requireAuth(identityProvider), listMyNotificationsHandler);
