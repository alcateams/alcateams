import type { AdminSessionPort } from "../../../auth/admin-session.port";
import type { Community } from "../../domain/community.entity";
import {
  CommunityNotFoundError,
  GeneralChannelAlreadyExistsError,
} from "../../domain/community.errors";
import { GENERAL_CHANNEL, isReservedSubGroupName } from "../../domain/general-channel";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import type { CommunityProviderPort } from "../../provider/community-provider.port";
import type { BubbleMembershipSync } from "../../services/bubble-membership";
import { type CommunityAccess, loadCommunityForMember } from "../../services/community-access";

interface GetCommunityInput {
  communityId: string;
  userId: string;
}

export class GetCommunityUseCase {
  constructor(
    private readonly communityRepository: CommunityRepositoryPort,
    private readonly communityProvider: CommunityProviderPort,
    private readonly adminSession: AdminSessionPort,
    private readonly bubbleMembership: Pick<BubbleMembershipSync, "addMembers">,
  ) {}

  /** Opens a community for one of its members, with its channels. */
  async execute(input: GetCommunityInput): Promise<CommunityAccess> {
    const access = await loadCommunityForMember(
      this.communityRepository,
      input.communityId,
      input.userId,
    );
    const { community } = access;
    if (community.generalChannel) return access;
    // A legacy sub-group already uses the reserved name: creating the channel would collide on
    // every open, so leave the community as is.
    if (community.subGroups.some((subGroup) => isReservedSubGroupName(subGroup.name))) {
      return access;
    }

    try {
      return { ...access, community: await this.createGeneralChannel(community) };
    } catch (error) {
      // The community is readable without its general channel; retry on the next open.
      console.error(`[get-community] canal général de ${community.id} non créé :`, error);
      return access;
    }
  }

  /**
   * Communities created before channels existed have no general channel: create it on first
   * access. The admin account owns its bubble (we don't hold the creator's token here), and all
   * current members are added to it.
   */
  private async createGeneralChannel(community: Community): Promise<Community> {
    const admin = await this.adminSession.getAdminSession();
    const rainbowBubbleId = await this.communityProvider.createBubble(admin.token, {
      name: `${community.name} · ${GENERAL_CHANNEL.name}`,
      topic: GENERAL_CHANNEL.theme,
    });

    let updated: Community;
    try {
      updated = await this.communityRepository.addSubGroup(community.id, {
        ...GENERAL_CHANNEL,
        kind: "GENERAL",
        rainbowBubbleId,
      });
    } catch (error) {
      await this.communityProvider
        .deleteBubble(admin.token, rainbowBubbleId)
        .catch((e: unknown) => {
          console.error(`[get-community] bulle orpheline ${rainbowBubbleId} :`, e);
        });
      // A concurrent request created the channel first: use theirs.
      if (error instanceof GeneralChannelAlreadyExistsError) return this.reload(community.id);
      throw error;
    }

    const memberIds = await this.communityRepository.listMemberIds(community.id);
    await this.bubbleMembership.addMembers([rainbowBubbleId], memberIds);
    return updated;
  }

  private async reload(communityId: string): Promise<Community> {
    const community = await this.communityRepository.findById(communityId);
    if (!community) throw new CommunityNotFoundError();
    return community;
  }
}
