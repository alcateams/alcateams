import { type Request, type Response } from "express";
import { ListMyNotificationsUseCase } from "./list-my-notifications.use-case";
import { NotificationRepository } from "../../database/notification.repository";
import { toNotificationResponse } from "../../notification.response";

const listMyNotificationsUseCase = new ListMyNotificationsUseCase(new NotificationRepository());

export const listMyNotificationsHandler = async (req: Request, res: Response) => {
  // `requireAuth` guarantees `identityId` is set; guard defensively in case it is mounted without it.
  const identityId = req.identityId;
  if (!identityId) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  try {
    const notifications = await listMyNotificationsUseCase.execute(identityId);
    res.status(200).json(notifications.map(toNotificationResponse));
  } catch (error) {
    console.error("[list-my-notifications] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
