import { type Request, type Response } from "express";
import { JoinCommunityUseCase } from "./join-community.use-case";
import { CommunityRepository } from "../../database/community.repository";
import { AlreadyMemberError, CommunityNotFoundError } from "../../domain/community.errors";
import { toCommunityResponse } from "../../community.response";

const joinCommunityUseCase = new JoinCommunityUseCase(new CommunityRepository());

export const joinCommunityHandler = async (req: Request, res: Response) => {
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
    const community = await joinCommunityUseCase.execute({
      communityId,
      userId: identityId,
    });
    res.status(200).json(toCommunityResponse(community));
  } catch (error) {
    if (error instanceof CommunityNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof AlreadyMemberError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error("[join-community] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
