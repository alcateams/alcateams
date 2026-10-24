import { vi } from "vitest";
import type { AdminSessionPort } from "../../auth/admin-session.port";
import { Community } from "../domain/community.entity";
import type { MessageProps } from "../domain/message.types";
import type { CommunityRepositoryPort } from "../database/community.repository.port";
import type { MessageRepositoryPort } from "../database/message.repository.port";
import type { CommunityProviderPort } from "../provider/community-provider.port";
import type { MessageIndexerPort } from "../provider/message-indexer.port";
import type { MessagingProviderPort } from "../provider/messaging-provider.port";

export const ADMIN = { token: "admin-token", userId: "admin" };

export const makeAdminSession = () =>
  ({ getAdminSession: vi.fn(async () => ADMIN) }) satisfies AdminSessionPort;

export const makeCommunityProvider = () => {
  let counter = 0;
  return {
    createBubble: vi.fn<CommunityProviderPort["createBubble"]>(async () => `bubble-${++counter}`),
    deleteBubble: vi.fn<CommunityProviderPort["deleteBubble"]>(async () => {}),
    addMember: vi.fn<CommunityProviderPort["addMember"]>(async () => {}),
  } satisfies CommunityProviderPort;
};

export const makeCommunityRepository = () =>
  ({
    save: vi.fn(async (community: Community) => community),
    findByName: vi.fn<CommunityRepositoryPort["findByName"]>(async () => null),
    findById: vi.fn<CommunityRepositoryPort["findById"]>(async () => null),
    listForUser: vi.fn(async () => []),
    search: vi.fn(async () => []),
    addMember: vi.fn(async () => {}),
    findMemberRole: vi.fn<CommunityRepositoryPort["findMemberRole"]>(async () => "MEMBER"),
    listMemberIds: vi.fn<CommunityRepositoryPort["listMemberIds"]>(async () => []),
    addSubGroup: vi.fn<CommunityRepositoryPort["addSubGroup"]>(),
  }) satisfies CommunityRepositoryPort;

export const makeMessage = (overrides: Partial<MessageProps> = {}): MessageProps => ({
  id: "message-1",
  subGroupId: "sub-1",
  authorId: "user-1",
  authorPseudo: "alice",
  text: "Bonjour",
  rainbowSyncStatus: "PENDING",
  createdAt: new Date("2026-10-23T10:00:00Z"),
  ...overrides,
});

export const makeMessageRepository = () =>
  ({
    save: vi.fn<MessageRepositoryPort["save"]>(async (props) => makeMessage(props)),
    listBySubGroup: vi.fn<MessageRepositoryPort["listBySubGroup"]>(async () => ({
      messages: [],
      nextCursor: null,
    })),
    updateRainbowSync: vi.fn<MessageRepositoryPort["updateRainbowSync"]>(async () => {}),
  }) satisfies MessageRepositoryPort;

export const makeMessagingProvider = () =>
  ({
    sendMessage: vi.fn<MessagingProviderPort["sendMessage"]>(async () => "rainbow-message-1"),
  }) satisfies MessagingProviderPort;

export const makeMessageIndexer = () =>
  ({ index: vi.fn<MessageIndexerPort["index"]>(async () => {}) }) satisfies MessageIndexerPort;

const AT = new Date("2026-10-01T00:00:00Z");

export const makeCommunity = ({ withGeneral = true, isPrivate = false } = {}) =>
  new Community({
    id: "community-1",
    name: "Chess club",
    description: "All about chess",
    isPrivate,
    subGroups: [
      ...(withGeneral
        ? [{ id: "general", name: "Général", theme: "x", kind: "GENERAL" as const }]
        : []),
      { id: "sub-1", name: "Openings", theme: "Theory", kind: "THEMATIC" as const },
    ].map((subGroup) => ({
      ...subGroup,
      rainbowBubbleId: `bubble-${subGroup.id}`,
      createdAt: AT,
      updatedAt: AT,
    })),
    createdAt: AT,
    updatedAt: AT,
  });
