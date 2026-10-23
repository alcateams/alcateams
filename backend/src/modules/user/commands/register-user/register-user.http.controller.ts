import { type Request, type Response } from "express";
import { RegisterUserUseCase } from "./register-user.use-case.ts";
import { registerUserDto } from "./register-user.request.dto";
import { UserRepository } from "../../database/user.repository";
import { RainbowIdentityProvider } from "../../../auth/rainbow-identity-provider.adapter";
import { PseudoAlreadyTakenError, UserAlreadyExistsError } from "../../domain/user.errors";
import { toUserResponse } from "../../user.response";

const registerUserUseCase = new RegisterUserUseCase(
  new UserRepository(),
  new RainbowIdentityProvider(),
);

export const registerHandler = async (req: Request, res: Response) => {
  const validation = registerUserDto.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ error: validation.error.flatten().fieldErrors });
    return;
  }

  try {
    const { token, user } = await registerUserUseCase.execute(validation.data);
    res.status(201).json({ token, user: toUserResponse(user) });
  } catch (error) {
    if (error instanceof UserAlreadyExistsError || error instanceof PseudoAlreadyTakenError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error("[register] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
