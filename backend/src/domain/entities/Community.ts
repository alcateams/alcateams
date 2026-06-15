export class Community {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public readonly createdAt: Date,
  ) {}
}
