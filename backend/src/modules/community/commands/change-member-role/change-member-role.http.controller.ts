import { type Request, type Response } from "express";
import { ChangeMemberRoleUseCase } from "./change-member-role.use-case";
import { changeMemberRoleDto } from "./change-member-role.request.dto";
import { CommunityRepository } from "../../database/community.repository";
import {
  CannotEditOwnRoleError,
  CommunityNotFoundError,
  LastModeratorError,
  MemberNotFoundError,
  NotCommunityModeratorError,
} from "../../domain/community.errors";

const changeMemberRoleUseCase = new ChangeMemberRoleUseCase(new CommunityRepository());

export const changeMemberRoleHandler = async (req: Request, res: Response) => {
  const validation = changeMemberRoleDto.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ error: validation.error.flatten().fieldErrors });
    return;
  }

  // `requireAuth` guarantees `identityId` is set; guard defensively in case it is mounted without it.
  const identityId = req.identityId;
  if (!identityId) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  const communityId = typeof req.params.id === "string" ? req.params.id : "";
  const targetUserId = typeof req.params.userId === "string" ? req.params.userId : "";
  if (!communityId || !targetUserId) {
    res.status(400).json({ error: "Identifiant de communauté ou de membre manquant" });
    return;
  }

  try {
    const result = await changeMemberRoleUseCase.execute({
      communityId,
      callerId: identityId,
      targetUserId,
      newRole: validation.data.role,
    });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof CommunityNotFoundError || error instanceof MemberNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof NotCommunityModeratorError || error instanceof CannotEditOwnRoleError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof LastModeratorError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error("[change-member-role] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
