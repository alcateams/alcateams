import { rainbowConfig } from "../../../config/rainbow.config";
import { MessageDeliveryFailedError } from "./messaging-provider.errors";
import type { MessagingProviderPort, OutgoingMessage } from "./messaging-provider.port";
import {
  RAINBOW_REQUEST_TIMEOUT_MS,
  rainbowUserHeaders,
  readRainbowErrorMessage,
} from "./rainbow-http";

type RainbowData<T> = { data: T };

const S2S_CONNECTIONS_ENDPOINT = "/api/rainbow/ucs/v1.0/connections";

/**
 * Sends bubble messages through Rainbow's server-to-server (S2S) REST API, the only REST route
 * Rainbow offers for instant messages. Each send opens a short-lived S2S connection for the
 * author, joins the room, resolves the room conversation, posts the message and closes the
 * connection, so the message appears in Rainbow as written by the author.
 *
 * Rainbow fails (HTTP 500) when one user has several S2S connections joining at once, so each
 * user's sends are queued and run one at a time, which also preserves their order in Rainbow.
 */
export class RainbowMessagingProvider implements MessagingProviderPort {
  private readonly queues = new Map<string, Promise<unknown>>();

  sendMessage(userToken: string, userId: string, message: OutgoingMessage): Promise<string> {
    const previous = this.queues.get(userId) ?? Promise.resolve();
    // Run after the user's previous send, whether it succeeded or not.
    const send = previous.catch(() => {}).then(() => this.send(userToken, userId, message));
    this.queues.set(userId, send);
    // Drop the queue entry once idle so the map doesn't grow with every user who ever posted.
    void send
      .catch(() => {})
      .finally(() => {
        if (this.queues.get(userId) === send) this.queues.delete(userId);
      });
    return send;
  }

  private async send(userToken: string, userId: string, message: OutgoingMessage): Promise<string> {
    const connectionId = await this.openConnection(userToken);

    try {
      await this.request(
        userToken,
        "join room",
        "POST",
        `${S2S_CONNECTIONS_ENDPOINT}/${connectionId}/rooms/${encodeURIComponent(message.bubbleId)}/join`,
      );
      const conversationId = await this.requestId(
        userToken,
        "open conversation",
        "POST",
        `/api/rainbow/enduser/v1.0/users/${encodeURIComponent(userId)}/conversations`,
        { peerId: message.bubbleId, type: "room", mute: false },
      );
      return await this.requestId(
        userToken,
        "send",
        "POST",
        `${S2S_CONNECTIONS_ENDPOINT}/${connectionId}/conversations/${conversationId}/messages`,
        { message: { body: message.text, lang: "fr" } },
      );
    } finally {
      await this.closeConnection(userToken, connectionId);
    }
  }

  private async openConnection(userToken: string): Promise<string> {
    // Rainbow requires a callback URL for S2S events. We don't consume them (history is read
    // from our own database).
    return this.requestId(userToken, "open connection", "POST", S2S_CONNECTIONS_ENDPOINT, {
      connection: { callback_url: rainbowConfig.s2sCallbackUrl },
    });
  }

  private async closeConnection(userToken: string, connectionId: string): Promise<void> {
    await this.request(
      userToken,
      "close connection",
      "DELETE",
      `${S2S_CONNECTIONS_ENDPOINT}/${connectionId}`,
    ).catch((error: unknown) => {
      // Rainbow expires idle connections anyway; don't fail a delivered message over this.
      console.error("[rainbow-messaging] fermeture de la connexion S2S impossible :", error);
    });
  }

  private async request<T = unknown>(
    userToken: string,
    step: string,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${rainbowConfig.host}${path}`, {
      method,
      headers: {
        ...rainbowUserHeaders(userToken),
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(RAINBOW_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new MessageDeliveryFailedError(step, await readRainbowErrorMessage(response));
    }

    const json = (await response.json().catch(() => null)) as RainbowData<T> | null;
    return json?.data as T;
  }

  /** Like `request`, for steps whose response must carry an id we then rely on. */
  private async requestId(
    userToken: string,
    step: string,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<string> {
    const data = await this.request<{ id?: unknown } | undefined>(
      userToken,
      step,
      method,
      path,
      body,
    );
    if (typeof data?.id !== "string" || data.id === "") {
      throw new MessageDeliveryFailedError(step, "réponse Rainbow inattendue");
    }
    return data.id;
  }
}
