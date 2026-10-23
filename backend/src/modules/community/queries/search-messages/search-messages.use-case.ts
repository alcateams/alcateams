import type { Community } from "../../domain/community.entity";
import { SubGroupNotFoundError } from "../../domain/community.errors";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import type {
  MessageSearchHit,
  MessageSearchPort,
  MessageSearchSort,
} from "../../provider/message-search.port";
import { loadCommunityForMember } from "../../services/community-access";

interface SearchMessagesInput {
  userId: string;
  q: string;
  communityId?: string;
  subGroupId?: string;
  sort: MessageSearchSort;
  limit: number;
  offset: number;
}

export interface MessageSearchResultItem extends MessageSearchHit {
  communityName: string;
  subGroupName: string;
}

export interface MessageSearchPage {
  results: MessageSearchResultItem[];
  total: number;
  /** Offset of the next page, or `null` on the last one. */
  nextOffset: number | null;
}

export class SearchMessagesUseCase {
  constructor(
    private readonly communityRepository: CommunityRepositoryPort,
    private readonly messageSearch: MessageSearchPort,
  ) {}

  /**
   * Searches the messages of the communities the user belongs to, optionally narrowed to one
   * community or channel. Membership is checked against the database on every search, so leaving
   * a community immediately hides its messages.
   */
  async execute(input: SearchMessagesInput): Promise<MessageSearchPage> {
    const communities = await this.loadScope(input);

    const { hits, total } = await this.messageSearch.search({
      query: input.q,
      communityIds: communities.map((community) => community.id),
      subGroupId: input.subGroupId,
      sort: input.sort,
      limit: input.limit,
      offset: input.offset,
    });

    const byId = new Map(communities.map((community) => [community.id, community]));
    const results = hits.flatMap((hit): MessageSearchResultItem[] => {
      const community = byId.get(hit.communityId);
      const subGroup = community?.findSubGroup(hit.subGroupId);
      // The index can lag behind the database (e.g. a deleted channel): skip what's gone.
      if (!community || !subGroup) return [];
      return [{ ...hit, communityName: community.name, subGroupName: subGroup.name }];
    });

    const nextOffset = input.offset + hits.length;
    return {
      results,
      total,
      nextOffset: hits.length === input.limit && nextOffset < total ? nextOffset : null,
    };
  }

  private async loadScope(input: SearchMessagesInput): Promise<Community[]> {
    if (!input.communityId) return this.communityRepository.listForUser(input.userId);

    const { community } = await loadCommunityForMember(
      this.communityRepository,
      input.communityId,
      input.userId,
    );
    if (input.subGroupId && !community.findSubGroup(input.subGroupId)) {
      throw new SubGroupNotFoundError();
    }
    return [community];
  }
}
