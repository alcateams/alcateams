import { Community } from "../../domain/community.entity";
import { CommunityNameAlreadyTakenError } from "../../domain/community.errors";
import type { CreateSubGroupProps } from "../../domain/community.types";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import type { CommunityProviderPort } from "../../community-provider.port";

interface SubGroupInput {
  name: string;
  theme: string;
}

interface CreateCommunityInput {
  name: string;
  description: string;
  subGroups: SubGroupInput[];
  creatorId: string;
  creatorToken: string;
}

export class CreateCommunityUseCase {
  constructor(
    private readonly communityRepository: CommunityRepositoryPort,
    private readonly communityProvider: CommunityProviderPort,
  ) {}

  async execute(input: CreateCommunityInput): Promise<Community> {
    await this.ensureNameIsAvailable(input.name);
    const subGroups = await this.createBubbles(input);
    return this.persistOrRollback(input, subGroups);
  }

  private async ensureNameIsAvailable(name: string): Promise<void> {
    const existing = await this.communityRepository.findByName(name);
    if (existing) throw new CommunityNameAlreadyTakenError();
  }

  /**
   * Provisions one Rainbow bubble per sub-group on behalf of the creator (who thus owns each
   * bubble). If any bubble fails, the ones already created are rolled back before propagating.
   */
  private async createBubbles(input: CreateCommunityInput): Promise<CreateSubGroupProps[]> {
    const created: CreateSubGroupProps[] = [];

    try {
      for (const subGroup of input.subGroups) {
        const rainbowBubbleId = await this.communityProvider.createBubble(input.creatorToken, {
          name: subGroup.name,
          topic: subGroup.theme,
        });
        created.push({ name: subGroup.name, theme: subGroup.theme, rainbowBubbleId });
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
        this.communityProvider.deleteBubble(userToken, subGroup.rainbowBubbleId).catch(() => {
          // Swallow rollback failures so the original error is surfaced.
        }),
      ),
    );
  }
}
