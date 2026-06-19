import { type Request, type Response } from "express";
import { RegisterUserService } from "./register-user.service";
import { registerUserDto } from "./register-user.request.dto";
import { UserRepository } from "../../database/user.repository";
import { RainbowIdentityProvider } from "../../../auth/rainbow-identity-provider.adapter";
import { UserAlreadyExistsError } from "../../domain/user.errors";

const registerUserService = new RegisterUserService(
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
    const result = await registerUserService.execute(validation.data);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error("[register] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
