import type { NextFunction, Request, Response } from "express";
import { TokenValidationFailedError } from "./auth.errors";
import type { IdentityProvider } from "./identity-provider.port";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Identity-provider user id, set by `requireAuth` once the token is validated. */
      identityId?: string;
    }
  }
}

/**
 * Express middleware that validates the `Authorization: Bearer <token>` header against
 * the identity provider and attaches the resolved identity id to the request.
 * Centralises authentication so individual handlers no longer parse headers themselves.
 */
export function requireAuth(identityProvider: IdentityProvider) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token manquant" });
      return;
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      req.identityId = await identityProvider.validateToken(token);
      next();
    } catch (error) {
      if (error instanceof TokenValidationFailedError) {
        res.status(401).json({ error: error.message });
        return;
      }
      console.error("[requireAuth] erreur inattendue :", error);
      res.status(500).json({ error: "Une erreur inattendue s'est produite" });
    }
  };
}
