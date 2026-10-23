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
    super("Vous devez être membre de cette communauté");
    this.name = "NotCommunityMemberError";
  }
}

export class SubGroupNotFoundError extends Error {
  constructor() {
    super("Ce sous-groupe est introuvable");
    this.name = "SubGroupNotFoundError";
  }
}

/** Raised when two requests race to create the same community's general channel. */
export class GeneralChannelAlreadyExistsError extends Error {
  constructor() {
    super("Le canal général de cette communauté existe déjà");
    this.name = "GeneralChannelAlreadyExistsError";
  }
}
