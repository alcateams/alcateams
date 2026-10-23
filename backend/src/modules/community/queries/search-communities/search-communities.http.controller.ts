import { type Request, type Response } from "express";
import { searchCommunitiesDto } from "./search-communities.request.dto";
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

  // An array (`?q=a&q=b`) or an over-long term fails validation instead of being coerced.
  const validation = searchCommunitiesDto.safeParse(req.query);
  if (!validation.success) {
    res.status(400).json({ error: validation.error.flatten().fieldErrors });
    return;
  }
  const term = validation.data.q;

  try {
    const communities = await searchCommunitiesUseCase.execute(term);
    res.status(200).json(communities.map(toCommunityResponse));
  } catch (error) {
    console.error("[search-communities] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
