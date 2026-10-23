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

export class NotCommunityMemberError extends Error {
  constructor() {
    super("Vous n'êtes pas membre de cette communauté");
    this.name = "NotCommunityMemberError";
  }
}

export class NotCommunityModeratorError extends Error {
  constructor() {
    super("Seul un modérateur de cette communauté peut effectuer cette action");
    this.name = "NotCommunityModeratorError";
  }
}

export class MemberNotFoundError extends Error {
  constructor() {
    super("Ce membre ne fait pas partie de la communauté");
    this.name = "MemberNotFoundError";
  }
}

export class CannotEditOwnRoleError extends Error {
  constructor() {
    super("Vous ne pouvez pas modifier votre propre rôle");
    this.name = "CannotEditOwnRoleError";
  }
}

export class LastModeratorError extends Error {
  constructor() {
    super("Impossible de retirer le dernier modérateur de la communauté");
    this.name = "LastModeratorError";
  }
}
