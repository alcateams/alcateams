import crypto from "crypto";
import type { CommunityProps, CreateCommunityProps, ThemeProps } from "./community.types";

export class Community {
  constructor(private readonly props: CommunityProps) {}

  static create(props: CreateCommunityProps): Community {
    const now = new Date();
    return new Community({
      id: crypto.randomUUID(),
      name: props.name,
      description: props.description,
      themes: props.themes.map((theme) => ({
        id: crypto.randomUUID(),
        name: theme.name,
        rainbowBubbleId: theme.rainbowBubbleId,
        createdAt: now,
        updatedAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get themes(): readonly ThemeProps[] {
    return this.props.themes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): CommunityProps {
    return this.props;
  }
}
