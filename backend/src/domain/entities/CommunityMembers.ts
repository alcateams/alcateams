export enum GlobalRole {
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  MEMBER = "MEMBER",
}

export class CommunityMember {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly communityId: string,
    public role: GlobalRole,
    public warningCount: number,
    public readonly joinedAt: Date,
  ) {}

  // Business logic: Encapsulating the warning behavior
  issueWarning() {
    this.warningCount += 1;
  }

  isEligibleForBan(): boolean {
    return this.warningCount >= 3;
  }
}
