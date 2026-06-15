import cors from "cors";
import express, { type Application } from "express";
import session from "express-session";
import helmet from "helmet";
import passport from "passport";

import { test } from "./infrastructure/rainbow/user";

import { configurePassport } from "./config/passport.config";
import authRoutes from "./infrastructure/web/routes/auth.routes";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { requireAuth } from "./middlewares/requireAuth.middleware";

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
  }),
);

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  test();
  res.send("Hello World!");
});

// app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/communities", communityRoutes);
// app.use("/api/knowledge", knowledgeRoutes);

// app.use(notFoundHandler);
app.use(requestLogger);

app.use(requireAuth);

app.use(errorHandler);

export default app;
