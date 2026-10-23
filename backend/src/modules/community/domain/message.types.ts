/** Whether a message has been mirrored to the sub-group's Rainbow bubble yet. */
export type RainbowSyncStatus = "PENDING" | "SYNCED" | "FAILED";

export interface MessageProps {
  id: string;
  subGroupId: string;
  authorId: string;
  authorPseudo: string;
  text: string;
  rainbowSyncStatus: RainbowSyncStatus;
  createdAt: Date;
}

export interface CreateMessageProps {
  subGroupId: string;
  authorId: string;
  text: string;
}
