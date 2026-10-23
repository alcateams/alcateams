export class BubbleCreationFailedError extends Error {
  constructor(cause: string) {
    super(`Impossible de créer la bulle : ${cause}`);
    this.name = "BubbleCreationFailedError";
  }
}

export class BubbleDeletionFailedError extends Error {
  constructor(cause: string) {
    super(`Impossible de supprimer la bulle : ${cause}`);
    this.name = "BubbleDeletionFailedError";
  }
}

export class BubbleMemberAdditionFailedError extends Error {
  constructor(cause: string) {
    super(`Impossible d'ajouter le membre à la bulle : ${cause}`);
    this.name = "BubbleMemberAdditionFailedError";
  }
}
