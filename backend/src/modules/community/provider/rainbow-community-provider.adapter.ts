import { rainbowConfig } from "../../../config/rainbow.config";
import type {
  BubbleDraft,
  BubblePrivilege,
  CommunityProviderPort,
} from "./community-provider.port";
import {
  BubbleCreationFailedError,
  BubbleDeletionFailedError,
  BubbleMemberAdditionFailedError,
  BubbleMemberRemovalFailedError,
} from "./community-provider.errors";
import {
  RAINBOW_REQUEST_TIMEOUT_MS,
  rainbowUserHeaders,
  readRainbowErrorMessage,
} from "./rainbow-http";

type RainbowCreatedRoomResponse = { data: { id: string } };

const ROOMS_ENDPOINT = "/api/rainbow/enduser/v1.0/rooms";
const NOT_FOUND = 404;
const CONFLICT = 409;

/**
 * Rainbow-backed implementation of the community bubble provider. Each call uses the given
 * token, so a bubble created with a user's token is owned (i.e. moderated) by that user.
 */
export class RainbowCommunityProvider implements CommunityProviderPort {
  async createBubble(userToken: string, bubble: BubbleDraft): Promise<string> {
    const response = await fetch(`${rainbowConfig.host}${ROOMS_ENDPOINT}`, {
      method: "POST",
      headers: { ...rainbowUserHeaders(userToken), "Content-Type": "application/json" },
      body: JSON.stringify({ name: bubble.name, topic: bubble.topic, visibility: "private" }),
      signal: AbortSignal.timeout(RAINBOW_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new BubbleCreationFailedError(await readRainbowErrorMessage(response));
    }

    const createdRoom = (await response.json()) as RainbowCreatedRoomResponse;
    return createdRoom.data.id;
  }

  async deleteBubble(userToken: string, bubbleId: string): Promise<void> {
    const response = await fetch(
      `${rainbowConfig.host}${ROOMS_ENDPOINT}/${encodeURIComponent(bubbleId)}`,
      {
        method: "DELETE",
        headers: rainbowUserHeaders(userToken),
        signal: AbortSignal.timeout(RAINBOW_REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      throw new BubbleDeletionFailedError(await readRainbowErrorMessage(response));
    }
  }

  async addMember(
    moderatorToken: string,
    bubbleId: string,
    userId: string,
    privilege: BubblePrivilege,
  ): Promise<void> {
    const response = await fetch(
      `${rainbowConfig.host}${ROOMS_ENDPOINT}/${encodeURIComponent(bubbleId)}/users`,
      {
        method: "POST",
        headers: { ...rainbowUserHeaders(moderatorToken), "Content-Type": "application/json" },
        // `accepted` adds the user directly instead of sending them an invitation.
        body: JSON.stringify({ userId, privilege, status: "accepted", reason: "AlcaTeams" }),
        signal: AbortSignal.timeout(RAINBOW_REQUEST_TIMEOUT_MS),
      },
    );

    // Already in the bubble: nothing to do.
    if (response.status === CONFLICT) return;
    if (!response.ok) {
      throw new BubbleMemberAdditionFailedError(await readRainbowErrorMessage(response));
    }
  }

  /**
   * Rainbow only deletes a membership that is no longer active, so an accepted member is first
   * unsubscribed (as the Rainbow SDK does). Deleting it too means a later `addMember` adds them
   * back, instead of hitting a 409 on a lingering "unsubscribed" membership.
   */
  async removeMember(moderatorToken: string, bubbleId: string, userId: string): Promise<void> {
    const memberUrl = `${rainbowConfig.host}${ROOMS_ENDPOINT}/${encodeURIComponent(bubbleId)}/users/${encodeURIComponent(userId)}`;

    const unsubscribed = await fetch(memberUrl, {
      method: "PUT",
      headers: { ...rainbowUserHeaders(moderatorToken), "Content-Type": "application/json" },
      body: JSON.stringify({ status: "unsubscribed" }),
      signal: AbortSignal.timeout(RAINBOW_REQUEST_TIMEOUT_MS),
    });
    // Not in the bubble: nothing to do.
    if (unsubscribed.status === NOT_FOUND) return;
    if (!unsubscribed.ok) {
      throw new BubbleMemberRemovalFailedError(await readRainbowErrorMessage(unsubscribed));
    }

    const deleted = await fetch(memberUrl, {
      method: "DELETE",
      headers: rainbowUserHeaders(moderatorToken),
      signal: AbortSignal.timeout(RAINBOW_REQUEST_TIMEOUT_MS),
    });
    if (deleted.status === NOT_FOUND) return;
    if (!deleted.ok) {
      throw new BubbleMemberRemovalFailedError(await readRainbowErrorMessage(deleted));
    }
  }
}
