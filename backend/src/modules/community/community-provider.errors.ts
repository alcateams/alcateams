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
