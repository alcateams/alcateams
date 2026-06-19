import { Community } from "../../domain/community.entity";
import { CommunityNameAlreadyTakenError } from "../../domain/community.errors";
import type { CreateThemeProps } from "../../domain/community.types";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import type { CommunityProviderPort } from "../../community-provider.port";

interface CreateCommunityInput {
  name: string;
  description: string;
  themes: string[];
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
    const themes = await this.createBubbles(input);
    return this.persistOrRollback(input, themes);
  }

  private async ensureNameIsAvailable(name: string): Promise<void> {
    const existing = await this.communityRepository.findByName(name);
    if (existing) throw new CommunityNameAlreadyTakenError();
  }

  /**
   * Provisions one Rainbow bubble per theme on behalf of the creator (who thus owns each bubble).
   * If any bubble fails, the ones already created are rolled back before propagating the error.
   */
  private async createBubbles(input: CreateCommunityInput): Promise<CreateThemeProps[]> {
    const created: CreateThemeProps[] = [];

    try {
      for (const themeName of input.themes) {
        const rainbowBubbleId = await this.communityProvider.createBubble(input.creatorToken, {
          name: themeName,
          topic: input.description,
        });
        created.push({ name: themeName, rainbowBubbleId });
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
    themes: CreateThemeProps[],
  ): Promise<Community> {
    const community = Community.create({
      name: input.name,
      description: input.description,
      themes,
    });

    try {
      return await this.communityRepository.save(community, input.creatorId);
    } catch (error) {
      await this.deleteBubbles(input.creatorToken, themes);
      throw error;
    }
  }

  private async deleteBubbles(userToken: string, themes: CreateThemeProps[]): Promise<void> {
    await Promise.all(
      themes.map((theme) =>
        this.communityProvider.deleteBubble(userToken, theme.rainbowBubbleId).catch(() => {
          // Swallow rollback failures so the original error is surfaced.
        }),
      ),
    );
  }
}
