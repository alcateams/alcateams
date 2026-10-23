export class CommunityNameAlreadyTakenError extends Error {
  constructor() {
    super("Une communauté avec ce nom existe déjà");
    this.name = "CommunityNameAlreadyTakenError";
  }
}

export class CommunityNotFoundError extends Error {
  constructor() {
    super("Cette communauté est introuvable");
    this.name = "CommunityNotFoundError";
  }
}

export class AlreadyMemberError extends Error {
  constructor() {
    super("Vous êtes déjà membre de cette communauté");
    this.name = "AlreadyMemberError";
  }
}

export class NotMemberError extends Error {
  constructor() {
    super("Vous n'êtes pas membre de cette communauté");
    this.name = "NotMemberError";
  }
}

export class LastModeratorError extends Error {
  constructor() {
    super(
      "Vous êtes le seul modérateur de cette communauté : nommez un autre modérateur avant de la quitter",
    );
    this.name = "LastModeratorError";
  }
}
