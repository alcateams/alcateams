export interface BubbleDraft {
  name: string;
  topic: string;
}

export type BubblePrivilege = "user" | "moderator";

/**
 * Abstracts the "bulle" provider (Rainbow) used to back each community sub-group with a room.
 * Every operation runs with the token it is given: a bubble created with a user's token is owned
 * by that user, and only the bubble's moderators can add members to it.
 */
export interface CommunityProviderPort {
  createBubble(userToken: string, bubble: BubbleDraft): Promise<string>;
  deleteBubble(userToken: string, bubbleId: string): Promise<void>;
  /** Adds the user to the bubble directly (no invitation). Succeeds if they are already in it. */
  addMember(
    moderatorToken: string,
    bubbleId: string,
    userId: string,
    privilege: BubblePrivilege,
  ): Promise<void>;
}
