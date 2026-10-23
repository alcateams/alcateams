import { type Request, type Response } from "express";
import { RainbowIdentityProvider } from "../../../auth/rainbow-identity-provider.adapter";
import { toCommunityDetailsResponse } from "../../community.response";
import { CommunityRepository } from "../../database/community.repository";
import { CommunityNotFoundError, NotCommunityMemberError } from "../../domain/community.errors";
import { RainbowCommunityProvider } from "../../provider/rainbow-community-provider.adapter";
import { BubbleMembershipSync } from "../../services/bubble-membership";
import { GetCommunityUseCase } from "./get-community.use-case";

const communityProvider = new RainbowCommunityProvider();
const adminSession = new RainbowIdentityProvider();
const getCommunityUseCase = new GetCommunityUseCase(
  new CommunityRepository(),
  communityProvider,
  adminSession,
  new BubbleMembershipSync(communityProvider, adminSession),
);

export const getCommunityHandler = async (req: Request, res: Response) => {
  // `requireAuth` guarantees `identityId` is set; guard defensively in case it is mounted without it.
  const identityId = req.identityId;
  if (!identityId) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  const communityId = typeof req.params.id === "string" ? req.params.id : "";

  try {
    const { community, role } = await getCommunityUseCase.execute({
      communityId,
      userId: identityId,
    });
    res.status(200).json(toCommunityDetailsResponse(community, role));
  } catch (error) {
    if (error instanceof CommunityNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof NotCommunityMemberError) {
      res.status(403).json({ error: error.message });
      return;
    }
    console.error("[get-community] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
