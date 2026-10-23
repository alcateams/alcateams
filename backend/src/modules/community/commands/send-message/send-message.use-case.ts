import { SubGroupNotFoundError } from "../../domain/community.errors";
import type { MessageProps } from "../../domain/message.types";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import type { MessageRepositoryPort } from "../../database/message.repository.port";
import type { MessageIndexerPort } from "../../provider/message-indexer.port";
import type { MessagingProviderPort } from "../../provider/messaging-provider.port";
import { loadCommunityForMember } from "../../services/community-access";

interface SendMessageInput {
  communityId: string;
  subGroupId: string;
  authorId: string;
  authorToken: string;
  text: string;
}

export interface SentMessage {
  message: MessageProps;
  /** Settles once the message is mirrored to Rainbow and indexed. Never rejects. */
  delivery: Promise<void>;
}

export class SendMessageUseCase {
  constructor(
    private readonly communityRepository: CommunityRepositoryPort,
    private readonly messageRepository: MessageRepositoryPort,
    private readonly messagingProvider: MessagingProviderPort,
    private readonly messageIndexer: MessageIndexerPort,
  ) {}

  /**
   * Stores the message, which makes it visible to the community right away, then mirrors it to
   * the channel's Rainbow bubble and the search index in the background: the database is the
   * source of truth, and Rainbow's S2S round-trips would otherwise delay the author.
   */
  async execute(input: SendMessageInput): Promise<SentMessage> {
    const { community } = await loadCommunityForMember(
      this.communityRepository,
      input.communityId,
      input.authorId,
    );
    const subGroup = community.findSubGroup(input.subGroupId);
    if (!subGroup) throw new SubGroupNotFoundError();

    const message = await this.messageRepository.save({
      subGroupId: subGroup.id,
      authorId: input.authorId,
      text: input.text,
    });

    const delivery = Promise.all([
      this.mirrorToRainbow(message, subGroup.rainbowBubbleId, input.authorToken),
      this.index(message, community.id),
    ]).then(() => undefined);

    return { message, delivery };
  }

  private async mirrorToRainbow(
    message: MessageProps,
    bubbleId: string,
    authorToken: string,
  ): Promise<void> {
    try {
      const rainbowMessageId = await this.messagingProvider.sendMessage(
        authorToken,
        message.authorId,
        { bubbleId, text: message.text },
      );
      await this.messageRepository.updateRainbowSync(message.id, "SYNCED", rainbowMessageId);
    } catch (error) {
      console.error(`[send-message] envoi du message ${message.id} à Rainbow impossible :`, error);
      await this.messageRepository
        .updateRainbowSync(message.id, "FAILED")
        .catch((updateError: unknown) => {
          console.error(
            `[send-message] statut du message ${message.id} non mis à jour :`,
            updateError,
          );
        });
    }
  }

  private async index(message: MessageProps, communityId: string): Promise<void> {
    await this.messageIndexer.index({ ...message, communityId }).catch((error: unknown) => {
      console.error(`[send-message] indexation du message ${message.id} impossible :`, error);
    });
  }
}
