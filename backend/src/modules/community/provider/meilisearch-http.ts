import { MeilisearchRequestFailedError } from "./meilisearch.errors";

export const MESSAGES_INDEX = "messages";

const REQUEST_TIMEOUT_MS = 10_000;

export interface MeilisearchConfig {
  host: string;
  apiKey: string;
}

/** Sends a JSON request to Meilisearch and returns the parsed body. Throws
 * `MeilisearchRequestFailedError` (tagged with `step`) on a non-2xx answer. */
export async function meilisearchRequest<T>(
  config: MeilisearchConfig,
  step: string,
  method: string,
  path: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`${config.host}${path}`, {
    method,
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new MeilisearchRequestFailedError(step, await readMeilisearchError(response));
  }
  return (await response.json()) as T;
}

/** Error bodies are `{ message, code }`, unless a proxy in front answered. */
async function readMeilisearchError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  try {
    const error = JSON.parse(text) as { message?: unknown };
    if (typeof error.message === "string") return error.message;
  } catch {
    // Not JSON: fall through to the status-based message.
  }
  return `HTTP ${response.status}`;
}
