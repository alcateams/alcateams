import { type Request, type Response } from "express";
import { toMessageResponse } from "../../community.response";
import { CommunityRepository } from "../../database/community.repository";
import { MessageRepository } from "../../database/message.repository";
import {
  CommunityNotFoundError,
  NotCommunityMemberError,
  SubGroupNotFoundError,
} from "../../domain/community.errors";
import { createMessageIndexer } from "../../provider/search-engine";
import { RainbowMessagingProvider } from "../../provider/rainbow-messaging-provider.adapter";
import { sendMessageDto } from "./send-message.request.dto";
import { SendMessageUseCase } from "./send-message.use-case";

const sendMessageUseCase = new SendMessageUseCase(
  new CommunityRepository(),
  new MessageRepository(),
  new RainbowMessagingProvider(),
  createMessageIndexer(),
);

export const sendMessageHandler = async (req: Request, res: Response) => {
  const validation = sendMessageDto.safeParse(req.body);
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
    // Rainbow delivery continues in the background (see `SendMessageUseCase`).
    const { message } = await sendMessageUseCase.execute({
      communityId: String(req.params.id),
      subGroupId: String(req.params.subGroupId),
      authorId: identityId,
      authorToken: identityToken,
      text: validation.data.text,
    });
    res.status(201).json(toMessageResponse(message));
  } catch (error) {
    if (error instanceof CommunityNotFoundError || error instanceof SubGroupNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof NotCommunityMemberError) {
      res.status(403).json({ error: error.message });
      return;
    }
    console.error("[send-message] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
