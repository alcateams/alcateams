import { rainbowConfig } from "../../../config/rainbow.config";
import type { BubbleDraft, CommunityProviderPort } from "./community-provider.port";
import { BubbleCreationFailedError, BubbleDeletionFailedError } from "./community-provider.errors";

type RainbowCreatedRoomResponse = { data: { id: string } };
type RainbowErrorResponse = { errorDetails: string | { msg: string }[] };

const ROOMS_ENDPOINT = "/api/rainbow/enduser/v1.0/rooms";
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Rainbow-backed implementation of the community bubble provider. Each call uses the caller's
 * own Rainbow token, so Rainbow assigns the caller as the room owner (i.e. moderator/admin).
 */
export class RainbowCommunityProvider implements CommunityProviderPort {
  async createBubble(userToken: string, bubble: BubbleDraft): Promise<string> {
    const response = await fetch(`${rainbowConfig.host}${ROOMS_ENDPOINT}`, {
      method: "POST",
      headers: { ...this.userHeaders(userToken), "Content-Type": "application/json" },
      body: JSON.stringify({ name: bubble.name, topic: bubble.topic, visibility: "private" }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new BubbleCreationFailedError(await this.readErrorMessage(response));
    }

    const createdRoom = (await response.json()) as RainbowCreatedRoomResponse;
    return createdRoom.data.id;
  }

  async deleteBubble(userToken: string, bubbleId: string): Promise<void> {
    const response = await fetch(
      `${rainbowConfig.host}${ROOMS_ENDPOINT}/${encodeURIComponent(bubbleId)}`,
      {
        method: "DELETE",
        headers: this.userHeaders(userToken),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      throw new BubbleDeletionFailedError(await this.readErrorMessage(response));
    }
  }

  private userHeaders(userToken: string) {
    return {
      Authorization: `Bearer ${userToken}`,
      Accept: "application/json",
    };
  }

  /** Error bodies are not guaranteed to be JSON (e.g. an HTML 502 from a proxy). */
  private async readErrorMessage(response: Response): Promise<string> {
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
}
