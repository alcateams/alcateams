import { type Request, type Response } from "express";
import { toMessageResponse } from "../../community.response";
import { CommunityRepository } from "../../database/community.repository";
import { MessageRepository } from "../../database/message.repository";
import {
  CommunityNotFoundError,
  NotCommunityMemberError,
  SubGroupNotFoundError,
} from "../../domain/community.errors";
import { listMessagesDto } from "./list-messages.request.dto";
import { ListMessagesUseCase } from "./list-messages.use-case";

const listMessagesUseCase = new ListMessagesUseCase(
  new CommunityRepository(),
  new MessageRepository(),
);

export const listMessagesHandler = async (req: Request, res: Response) => {
  const validation = listMessagesDto.safeParse(req.query);
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
    const page = await listMessagesUseCase.execute({
      ...validation.data,
      communityId: String(req.params.id),
      subGroupId: String(req.params.subGroupId),
      userId: identityId,
    });
    res.status(200).json({
      messages: page.messages.map(toMessageResponse),
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    if (error instanceof CommunityNotFoundError || error instanceof SubGroupNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof NotCommunityMemberError) {
      res.status(403).json({ error: error.message });
      return;
    }
    console.error("[list-messages] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
