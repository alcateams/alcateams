import { Router } from "express";
import { registerHandler } from "./commands/register-user/register-user.http.controller";
import { loginHandler } from "./commands/login-user/login-user.http.controller";
import { getCurrentUserHandler } from "./queries/get-current-user/get-current-user.http.controller";

export const userRouter = Router();

// TODO: Create a middleware and call it in each handler to validate the ZOD schema
userRouter.post("/register", registerHandler);
userRouter.post("/login", loginHandler);
userRouter.get("/me", getCurrentUserHandler);
