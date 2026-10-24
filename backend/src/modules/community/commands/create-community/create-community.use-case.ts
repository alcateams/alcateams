import type { AdminSessionPort } from "../../../auth/admin-session.port";
import { Community } from "../../domain/community.entity";
import { CommunityNameAlreadyTakenError } from "../../domain/community.errors";
import type { CreateSubGroupProps, SubGroupKind } from "../../domain/community.types";
import { GENERAL_CHANNEL } from "../../domain/general-channel";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import type { CommunityProviderPort } from "../../provider/community-provider.port";

interface SubGroupInput {
  name: string;
  theme: string;
}

type SubGroupDraft = SubGroupInput & { kind: SubGroupKind };

interface CreateCommunityInput {
  name: string;
  description: string;
  isPrivate?: boolean;
  subGroups: SubGroupInput[];
  creatorId: string;
  creatorToken: string;
}

export class CreateCommunityUseCase {
  constructor(
    private readonly communityRepository: CommunityRepositoryPort,
    private readonly communityProvider: CommunityProviderPort,
    private readonly adminSession: AdminSessionPort,
  ) {}

  async execute(input: CreateCommunityInput): Promise<Community> {
    await this.ensureNameIsAvailable(input.name);
    const subGroups = await this.createBubbles(input);
    // Logged before persisting so a crash between bubble creation and `save` stays recoverable.
    console.info(
      "[create-community] bulles créées avant persistance :",
      subGroups.map((subGroup) => subGroup.rainbowBubbleId),
    );
    return this.persistOrRollback(input, subGroups);
  }

  private async ensureNameIsAvailable(name: string): Promise<void> {
    const existing = await this.communityRepository.findByName(name);
    if (existing) throw new CommunityNameAlreadyTakenError();
  }

  /**
   * Provisions one Rainbow bubble for the general channel and one per sub-group on behalf of the
   * creator (who thus owns each bubble). The admin account is made moderator of each bubble so
   * the server can add the members who join later. If any step fails, the bubbles already
   * created are rolled back before propagating.
   */
  private async createBubbles(input: CreateCommunityInput): Promise<CreateSubGroupProps[]> {
    const admin = await this.adminSession.getAdminSession();
    const drafts: SubGroupDraft[] = [
      { ...GENERAL_CHANNEL, kind: "GENERAL" },
      ...input.subGroups.map((subGroup) => ({ ...subGroup, kind: "THEMATIC" as const })),
    ];
    const created: CreateSubGroupProps[] = [];

    try {
      for (const draft of drafts) {
        const rainbowBubbleId = await this.communityProvider.createBubble(input.creatorToken, {
          name: draft.kind === "GENERAL" ? `${input.name} · ${draft.name}` : draft.name,
          topic: draft.theme,
        });
        created.push({ ...draft, rainbowBubbleId });
        await this.communityProvider.addMember(
          input.creatorToken,
          rainbowBubbleId,
          admin.userId,
          "moderator",
        );
      }
      return created;
    } catch (error) {
      await this.deleteBubbles(input.creatorToken, created);
      throw error;
    }
  }

  /**
   * Persists the community. If persistence fails, the Rainbow bubbles we just created would be
   * orphaned, so we delete them before propagating the error to keep both systems consistent.
   */
  private async persistOrRollback(
    input: CreateCommunityInput,
    subGroups: CreateSubGroupProps[],
  ): Promise<Community> {
    const community = Community.create({
      name: input.name,
      description: input.description,
      isPrivate: input.isPrivate,
      subGroups,
    });

    try {
      return await this.communityRepository.save(community, input.creatorId);
    } catch (error) {
      await this.deleteBubbles(input.creatorToken, subGroups);
      throw error;
    }
  }

  private async deleteBubbles(userToken: string, subGroups: CreateSubGroupProps[]): Promise<void> {
    await Promise.all(
      subGroups.map((subGroup) =>
        this.communityProvider
          .deleteBubble(userToken, subGroup.rainbowBubbleId)
          .catch((error: unknown) => {
            // Don't mask the original error, but leave a trail for the orphaned bubble.
            console.error(
              `[create-community] échec du rollback de la bulle ${subGroup.rainbowBubbleId} :`,
              error,
            );
          }),
      ),
    );
  }
}
