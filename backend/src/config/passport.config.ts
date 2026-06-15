import passport from "passport";
import {
  Strategy as OpenIDConnectStrategy,
  type Profile,
} from "passport-openidconnect";
import { prisma } from "../infrastructure/database/prisma.client";

const findUserById = async (id: string) =>
  prisma.user.findUnique({ where: { id } });

// OAuth flow (Sprint 1 not required — placeholder only)
const findOrCreateRainbowUser = async (_profile: Profile) => null;

export const configurePassport = () => {
  passport.use(
    new OpenIDConnectStrategy(
      {
        issuer: process.env.RAINBOW_ISSUER_URL || "https://openrainbow.com",
        authorizationURL:
          process.env.RAINBOW_ISSUER_URL +
          "/api/rainbow/authentication/v1.0/oauth/authorize",
        tokenURL:
          process.env.RAINBOW_ISSUER_URL +
          "/api/rainbow/authentication/v1.0/oauth/token",
        userInfoURL:
          process.env.RAINBOW_ISSUER_URL +
          "/api/rainbow/authentication/v1.0/oauth/userinfo",

        clientID: process.env.OPENRAINBOW_APPLICATION_ID as string,
        clientSecret: process.env.OPENRAINBOW_APPLICATION_SECRET as string,
        callbackURL: "http://localhost:3000/api/auth/callback",

        scope: ["openid", "profile", "email"],
      },
      async (_issuer: string, profile: Profile, done: any) => {
        try {
          const user = await findOrCreateRainbowUser(profile);
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await findUserById(id);
      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  });
};
