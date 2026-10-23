export class MessageDeliveryFailedError extends Error {
  constructor(step: string, cause: string) {
    super(`Impossible d'envoyer le message (${step}) : ${cause}`);
    this.name = "MessageDeliveryFailedError";
  }
}
