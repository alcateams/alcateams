/**
 * The community-wide channel every community gets, stored as a `GENERAL` sub-group. Its name is
 * reserved: thematic sub-groups can't use it (see `isReservedSubGroupName`).
 */
export const GENERAL_CHANNEL = {
  name: "Général",
  theme: "Discussions de la communauté",
} as const;

export function isReservedSubGroupName(name: string): boolean {
  const normalized = name
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return normalized === "general";
}
