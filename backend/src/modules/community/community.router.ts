import { Router } from "express";
import { RainbowIdentityProvider } from "../auth/rainbow-identity-provider.adapter";
import { requireAuth } from "../auth/require-auth.middleware";
import { createCommunityHandler } from "./commands/create-community/create-community.http.controller";
import { joinCommunityHandler } from "./commands/join-community/join-community.http.controller";
import { listMyCommunitiesHandler } from "./queries/list-my-communities/list-my-communities.http.controller";
import { searchCommunitiesHandler } from "./queries/search-communities/search-communities.http.controller";

const identityProvider = new RainbowIdentityProvider();

export const communityRouter = Router();

// TODO: Add a middleware to validate the request body against the Zod schema.
communityRouter.post("/", requireAuth(identityProvider), createCommunityHandler);
communityRouter.get("/me", requireAuth(identityProvider), listMyCommunitiesHandler);
communityRouter.get("/search", requireAuth(identityProvider), searchCommunitiesHandler);
communityRouter.post("/:id/join", requireAuth(identityProvider), joinCommunityHandler);
