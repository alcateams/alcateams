import { Router } from "express";
import { RainbowIdentityProvider } from "../auth/rainbow-identity-provider.adapter";
import { requireAuth } from "../auth/require-auth.middleware";
import { registerHandler } from "./commands/register-user/register-user.http.controller";
import { loginHandler } from "./commands/login-user/login-user.http.controller";
import { getCurrentUserHandler } from "./queries/get-current-user/get-current-user.http.controller";

const identityProvider = new RainbowIdentityProvider();

export const userRouter = Router();

// TODO: Add a middleware to validate the request body against the Zod schema.
userRouter.post("/register", registerHandler);
userRouter.post("/login", loginHandler);
userRouter.get("/me", requireAuth(identityProvider), getCurrentUserHandler);
