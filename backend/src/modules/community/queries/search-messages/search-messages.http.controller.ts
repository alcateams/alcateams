import { type Request, type Response } from "express";
import { toMessageSearchPageResponse } from "../../community.response";
import { CommunityRepository } from "../../database/community.repository";
import {
  CommunityNotFoundError,
  NotCommunityMemberError,
  SubGroupNotFoundError,
} from "../../domain/community.errors";
import { MessageSearchUnavailableError } from "../../provider/message-search.errors";
import { createMessageSearch } from "../../provider/search-engine";
import { searchMessagesDto } from "./search-messages.request.dto";
import { SearchMessagesUseCase } from "./search-messages.use-case";

const searchMessagesUseCase = new SearchMessagesUseCase(
  new CommunityRepository(),
  createMessageSearch(),
);

export const searchMessagesHandler = async (req: Request, res: Response) => {
  const validation = searchMessagesDto.safeParse(req.query);
  if (!validation.success) {
    res.status(400).json({ error: validation.error.flatten().fieldErrors });
    return;
  }

  // `requireAuth` guarantees `identityId` is set; guard defensively in case it is mounted without it.
  const identityId = req.identityId;
  if (!identityId) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  try {
    const page = await searchMessagesUseCase.execute({ ...validation.data, userId: identityId });
    res.status(200).json(toMessageSearchPageResponse(page));
  } catch (error) {
    if (error instanceof CommunityNotFoundError || error instanceof SubGroupNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof NotCommunityMemberError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof MessageSearchUnavailableError) {
      res.status(503).json({ error: error.message });
      return;
    }
    console.error("[search-messages] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
