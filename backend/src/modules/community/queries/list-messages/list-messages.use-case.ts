import { SubGroupNotFoundError } from "../../domain/community.errors";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import type { MessagePage, MessageRepositoryPort } from "../../database/message.repository.port";
import { loadCommunityForMember } from "../../services/community-access";

interface ListMessagesInput {
  communityId: string;
  subGroupId: string;
  userId: string;
  before?: string;
  limit: number;
}

export class ListMessagesUseCase {
  constructor(
    private readonly communityRepository: CommunityRepositoryPort,
    private readonly messageRepository: MessageRepositoryPort,
  ) {}

  /** Returns a page of a channel's history, newest first. Members only. */
  async execute(input: ListMessagesInput): Promise<MessagePage> {
    const { community } = await loadCommunityForMember(
      this.communityRepository,
      input.communityId,
      input.userId,
    );
    if (!community.findSubGroup(input.subGroupId)) throw new SubGroupNotFoundError();

    return this.messageRepository.listBySubGroup(input.subGroupId, {
      before: input.before,
      limit: input.limit,
    });
  }
}
