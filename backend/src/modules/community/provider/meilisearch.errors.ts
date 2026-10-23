export class MeilisearchRequestFailedError extends Error {
  constructor(step: string, cause: string) {
    super(`Échec de Meilisearch (${step}) : ${cause}`);
    this.name = "MeilisearchRequestFailedError";
  }
}
