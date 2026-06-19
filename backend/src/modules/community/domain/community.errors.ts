export class CommunityNameAlreadyTakenError extends Error {
  constructor() {
    super("Une communauté avec ce nom existe déjà");
    this.name = "CommunityNameAlreadyTakenError";
  }
}
