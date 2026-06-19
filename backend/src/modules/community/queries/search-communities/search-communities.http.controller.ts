import { type Request, type Response } from "express";
import { SearchCommunitiesUseCase } from "./search-communities.use-case";
import { CommunityRepository } from "../../database/community.repository";
import { toCommunityResponse } from "../../community.response";

const searchCommunitiesUseCase = new SearchCommunitiesUseCase(new CommunityRepository());

export const searchCommunitiesHandler = async (req: Request, res: Response) => {
  // `requireAuth` guarantees `identityId` is set; guard defensively in case it is mounted without it.
  if (!req.identityId) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  const term = typeof req.query.q === "string" ? req.query.q : "";

  try {
    const communities = await searchCommunitiesUseCase.execute(term);
    res.status(200).json(communities.map(toCommunityResponse));
  } catch (error) {
    console.error("[search-communities] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
