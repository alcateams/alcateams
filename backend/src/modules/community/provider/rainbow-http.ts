type RainbowErrorResponse = { errorDetails: string | { msg: string }[] };

export const RAINBOW_REQUEST_TIMEOUT_MS = 10_000;

export function rainbowUserHeaders(userToken: string) {
  return {
    Authorization: `Bearer ${userToken}`,
    Accept: "application/json",
  };
}

/** Error bodies are not guaranteed to be JSON (e.g. an HTML 502 from a proxy). */
export async function readRainbowErrorMessage(response: Response): Promise<string> {
  const fallback = `HTTP ${response.status}`;
  const text = await response.text().catch(() => "");

  try {
    const error = JSON.parse(text) as Partial<RainbowErrorResponse>;
    if (typeof error.errorDetails === "string") return error.errorDetails;
    if (Array.isArray(error.errorDetails)) {
      return error.errorDetails.map((detail) => detail.msg).join(", ") || fallback;
    }
  } catch {
    // Not JSON: fall through to the status-based message.
  }

  return fallback;
}
