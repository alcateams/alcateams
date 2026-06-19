export interface BubbleDraft {
  name: string;
  topic: string;
}

/**
 * Abstracts the "bulle" provider (Rainbow) used to back each community theme with a room.
 * Operations run on behalf of the calling user so they become the bubble owner/moderator.
 */
export interface CommunityProviderPort {
  createBubble(userToken: string, bubble: BubbleDraft): Promise<string>;
  deleteBubble(userToken: string, bubbleId: string): Promise<void>;
}
