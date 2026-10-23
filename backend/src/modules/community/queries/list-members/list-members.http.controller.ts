import { type Request, type Response } from "express";
import { ListMembersUseCase } from "./list-members.use-case";
import { CommunityRepository } from "../../database/community.repository";
import { CommunityNotFoundError, NotCommunityModeratorError } from "../../domain/community.errors";
import { toCommunityMemberResponse } from "../../community.response";

const listMembersUseCase = new ListMembersUseCase(new CommunityRepository());

export const listMembersHandler = async (req: Request, res: Response) => {
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
    const members = await listMembersUseCase.execute({ communityId, callerId: identityId });
    res.status(200).json(members.map(toCommunityMemberResponse));
  } catch (error) {
    if (error instanceof CommunityNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof NotCommunityModeratorError) {
      res.status(403).json({ error: error.message });
      return;
    }
    console.error("[list-members] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
