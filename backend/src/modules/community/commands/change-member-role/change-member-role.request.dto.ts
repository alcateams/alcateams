import { z } from "zod";

export const changeMemberRoleDto = z.object({
  role: z.enum(["MODERATOR", "COMODERATOR", "MEMBER"]),
});

export type ChangeMemberRoleRequest = z.infer<typeof changeMemberRoleDto>;
