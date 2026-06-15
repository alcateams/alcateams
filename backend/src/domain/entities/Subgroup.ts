export class Subgroup {
  constructor(
    public readonly id: string,
    public name: string,
    public theme: string | null,
    public readonly communityId: string,
    public readonly rainbowBubbleId: string,
    public readonly createdAt: Date,
  ) {}
}
