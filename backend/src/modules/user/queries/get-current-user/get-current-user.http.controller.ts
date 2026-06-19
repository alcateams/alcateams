import { type Request, type Response } from "express";
import { GetCurrentUserUseCase } from "./get-current-user.use-case.ts";
import { UserRepository } from "../../database/user.repository";
import { RainbowIdentityProvider } from "../../../auth/rainbow-identity-provider.adapter";
import { TokenValidationFailedError } from "../../../auth/auth.errors";

const getCurrentUserService = new GetCurrentUserUseCase(
  new UserRepository(),
  new RainbowIdentityProvider(),
);

export const getCurrentUserHandler = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const user = await getCurrentUserService.execute(token);
    res.status(200).json(user);
  } catch (error) {
    if (error instanceof TokenValidationFailedError) {
      res.status(401).json({ error: error.message });
      return;
    }
    console.error("[me] erreur inattendue :", error);
    res.status(500).json({ error: "Une erreur inattendue s'est produite" });
  }
};
