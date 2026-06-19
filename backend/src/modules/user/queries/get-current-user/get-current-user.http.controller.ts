import { type Request, type Response } from "express";
import { GetCurrentUserUseCase } from "./get-current-user.use-case.ts";
import { UserRepository } from "../../database/user.repository";
import { UserNotFoundError } from "../../domain/user.errors";
import { toUserResponse } from "../../user.response";

const getCurrentUserUseCase = new GetCurrentUserUseCase(new UserRepository());

export const getCurrentUserHandler = async (req: Request, res: Response) => {
  // `requireAuth` guarantees `identityId` is set; guard defensively in case it is mounted without it.
  const identityId = req.identityId;
  if (!identityId) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  try {
    const user = await getCurrentUserUseCase.execute(identityId);
    res.status(200).json(toUserResponse(user));
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error("[me] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
