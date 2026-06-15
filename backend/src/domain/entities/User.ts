export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public name: string,
    public readonly rainbowUserId: string,
    public readonly createdAt: Date
  ) {}

  // Example of business logic inside the entity
  changeName(newName: string) {
    if (newName.length < 3) throw new Error("Name is too short");
    this.name = newName;
  }
}
