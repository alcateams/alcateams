export class KnowledgeItem {
  constructor(
    public readonly id: string,
    public readonly subgroupId: string,
    public readonly authorId: string | null,
    public readonly rainbowMessageId: string,
    public content: string,
    public tags: string[],
    public isPinned: boolean,
    public lastIndexedAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  markAsIndexed() {
    this.lastIndexedAt = new Date();
  }
}
