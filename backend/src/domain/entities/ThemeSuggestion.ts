export enum SuggestionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export class ThemeSuggestion {
  constructor(
    public readonly id: string,
    public suggestedName: string,
    public status: SuggestionStatus,
    public readonly userId: string,
    public readonly communityId: string,
    public readonly createdAt: Date
  ) {}

  approve() {
    this.status = SuggestionStatus.APPROVED;
  }

  reject() {
    this.status = SuggestionStatus.REJECTED;
  }
}
