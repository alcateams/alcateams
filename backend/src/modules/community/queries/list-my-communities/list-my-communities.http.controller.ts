import { type Request, type Response } from "express";
import { ListMyCommunitiesUseCase } from "./list-my-communities.use-case";
import { CommunityRepository } from "../../database/community.repository";
import { toCommunityResponse } from "../../community.response";

const listMyCommunitiesUseCase = new ListMyCommunitiesUseCase(new CommunityRepository());

export const listMyCommunitiesHandler = async (req: Request, res: Response) => {
  // `requireAuth` guarantees `identityId` is set; guard defensively in case it is mounted without it.
  const identityId = req.identityId;
  if (!identityId) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  try {
    const communities = await listMyCommunitiesUseCase.execute(identityId);
    res.status(200).json(communities.map(toCommunityResponse));
  } catch (error) {
    console.error("[list-my-communities] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
