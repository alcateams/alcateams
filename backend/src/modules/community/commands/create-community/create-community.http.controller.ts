import { type Request, type Response } from "express";
import { CreateCommunityUseCase } from "./create-community.use-case";
import { createCommunityDto } from "./create-community.request.dto";
import { CommunityRepository } from "../../database/community.repository";
import { RainbowCommunityProvider } from "../../rainbow-community-provider.adapter";
import { CommunityNameAlreadyTakenError } from "../../domain/community.errors";
import { toCommunityResponse } from "../../community.response";

const createCommunityUseCase = new CreateCommunityUseCase(
  new CommunityRepository(),
  new RainbowCommunityProvider(),
);

export const createCommunityHandler = async (req: Request, res: Response) => {
  const validation = createCommunityDto.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ error: validation.error.flatten().fieldErrors });
    return;
  }

  // `requireAuth` guarantees these are set; guard defensively in case it is mounted without it.
  const { identityId, identityToken } = req;
  if (!identityId || !identityToken) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  try {
    const community = await createCommunityUseCase.execute({
      ...validation.data,
      creatorId: identityId,
      creatorToken: identityToken,
    });
    res.status(201).json(toCommunityResponse(community));
  } catch (error) {
    if (error instanceof CommunityNameAlreadyTakenError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error("[create-community] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
