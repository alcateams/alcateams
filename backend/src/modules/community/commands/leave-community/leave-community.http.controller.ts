import { type Request, type Response } from "express";
import { LeaveCommunityUseCase } from "./leave-community.use-case";
import { CommunityRepository } from "../../database/community.repository";
import {
  CommunityNotFoundError,
  LastModeratorError,
  NotMemberError,
} from "../../domain/community.errors";

const leaveCommunityUseCase = new LeaveCommunityUseCase(new CommunityRepository());

export const leaveCommunityHandler = async (req: Request, res: Response) => {
  // `requireAuth` guarantees `identityId` is set; guard defensively in case it is mounted without it.
  const identityId = req.identityId;
  if (!identityId) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  const communityId = typeof req.params.id === "string" ? req.params.id : "";
  if (!communityId) {
    res.status(400).json({ error: "Identifiant de communauté manquant" });
    return;
  }

  try {
    await leaveCommunityUseCase.execute({ communityId, userId: identityId });
    res.status(204).end();
  } catch (error) {
    if (error instanceof CommunityNotFoundError || error instanceof NotMemberError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof LastModeratorError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error("[leave-community] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
