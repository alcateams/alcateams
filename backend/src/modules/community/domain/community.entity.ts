import crypto from "crypto";
import type { CommunityProps, CreateCommunityProps, SubGroupProps } from "./community.types";

export class Community {
  constructor(private readonly props: CommunityProps) {}

  static create(props: CreateCommunityProps): Community {
    const now = new Date();
    return new Community({
      id: crypto.randomUUID(),
      name: props.name,
      description: props.description,
      subGroups: props.subGroups.map((subGroup) => ({
        id: crypto.randomUUID(),
        name: subGroup.name,
        theme: subGroup.theme,
        kind: subGroup.kind,
        rainbowBubbleId: subGroup.rainbowBubbleId,
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

  get subGroups(): readonly SubGroupProps[] {
    return this.props.subGroups;
  }

  /** The community-wide channel, absent for communities created before channels existed. */
  get generalChannel(): SubGroupProps | undefined {
    return this.props.subGroups.find((subGroup) => subGroup.kind === "GENERAL");
  }

  findSubGroup(subGroupId: string): SubGroupProps | undefined {
    return this.props.subGroups.find((subGroup) => subGroup.id === subGroupId);
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
