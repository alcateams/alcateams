import { type Request, type Response } from "express";
import { z } from "zod";
import { LoginUserUseCase } from "./login-user.use-case.ts";
import { UserRepository } from "../../database/user.repository";
import { RainbowIdentityProvider } from "../../../auth/rainbow-identity-provider.adapter";
import { InvalidCredentialsError } from "../../domain/user.errors";
import { toUserResponse } from "../../user.response";

const loginUserRequestDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const loginUserService = new LoginUserUseCase(new UserRepository(), new RainbowIdentityProvider()); // TODO: May be use dependency injection

export const loginHandler = async (req: Request, res: Response) => {
  const validation = loginUserRequestDto.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ error: validation.error.flatten().fieldErrors });
    return;
  }

  try {
    const { token, user } = await loginUserService.execute(validation.data);
    res.status(200).json({ token, user: toUserResponse(user) });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: error.message });
      return;
    }
    console.error("[login] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
