export class MessageSearchUnavailableError extends Error {
  constructor() {
    super("La recherche de messages n'est pas disponible pour le moment");
    this.name = "MessageSearchUnavailableError";
  }
}
