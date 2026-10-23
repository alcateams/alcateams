import { type Request, type Response } from "express";
import { updateUserDto } from "./update-user.request.dto";
import { UpdateUserUseCase } from "./update-user.use-case";
import { UserRepository } from "../../database/user.repository";
import { RainbowIdentityProvider } from "../../../auth/rainbow-identity-provider.adapter";
import { AccountUpdateFailedError } from "../../../auth/auth.errors";
import {
  EmailAlreadyTakenError,
  PseudoAlreadyTakenError,
  UserNotFoundError,
} from "../../domain/user.errors";
import { toUserResponse } from "../../user.response";

const updateUserUseCase = new UpdateUserUseCase(new UserRepository(), new RainbowIdentityProvider());

export const updateUserHandler = async (req: Request, res: Response) => {
  // `requireAuth` guarantees `identityId` is set; guard defensively in case it is mounted without it.
  const identityId = req.identityId;
  if (!identityId) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  const validation = updateUserDto.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ error: validation.error.flatten().fieldErrors });
    return;
  }

  try {
    const user = await updateUserUseCase.execute(identityId, validation.data);
    res.status(200).json(toUserResponse(user));
  } catch (error) {
    if (error instanceof PseudoAlreadyTakenError || error instanceof EmailAlreadyTakenError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof AccountUpdateFailedError) {
      res.status(502).json({ error: error.message });
      return;
    }
    console.error("[update-profile] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
