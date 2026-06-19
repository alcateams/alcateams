import cors from "cors";
import express, { type Request, type Response } from "express";
import { env } from "./config/env.config";
import { communityRouter } from "./modules/community/community.router";
import { userRouter } from "./modules/user/user.router";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Healthcheck
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/users", userRouter);
app.use("/api/communities", communityRouter);

app.listen(env.PORT, () => {
  console.log(`🚀 Server started on http://localhost:${env.PORT}`);
});
