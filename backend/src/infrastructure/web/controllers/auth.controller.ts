import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { z } from "zod";
import { logger } from "../../../config/logger.config";
import { prisma } from "../../database/prisma.client";
import { rainbowClient } from "../../rainbow/rainbowClient";

const registerSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  pseudo: z.string().min(2, "Le pseudo doit contenir au moins 2 caractères"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: "Format de données invalide",
          details: result.error.issues.map((issue) => issue.message),
        });
        return;
      }

      const { email, password, pseudo } = result.data;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({ error: "Cet email est déjà utilisé." });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user in Rainbow SDK
      const sdk = rainbowClient.getSDK();
      let rainbowUserId = "";
      try {
        // According to Rainbow SDK docs: sdk.admin.createUser(email, password, firstname, lastname, ... )
        const rainbowUser = await sdk.admin.createUser(
          email,
          password,
          pseudo,
          pseudo,
          "",
          [],
        );
        rainbowUserId = rainbowUser.id;
      } catch (rainbowError: any) {
        logger.error(
          "[AuthController] Error creating Rainbow user:",
          rainbowError,
        );
        res.status(502).json({
          error:
            "Erreur lors de la création du compte de communication Rainbow.",
        });
        return;
      }

      // Create user in our Database
      const newUser = await prisma.user.create({
        data: {
          email,
          name: pseudo,
          password: hashedPassword,
          rainbowUserId,
        },
      });

      // Send success response
      req.logIn(newUser, (err) => {
        if (err) {
          logger.error("[AuthController] Session error after register:", err);
          return res
            .status(500)
            .json({ error: "Une erreur interne est survenue." });
        }
        res.status(201).json({
          message: "Inscription réussie avec succès.",
          user: { id: newUser.id, email: newUser.email, pseudo: newUser.name },
        });
      });
    } catch (error) {
      logger.error("[AuthController] Registration internal error:", error);
      res.status(500).json({ error: "Une erreur interne est survenue." });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Identifiants incorrects" });
        return;
      }

      const { email, password } = result.data;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({ error: "Identifiants incorrects" });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: "Identifiants incorrects" });
        return;
      }

      req.logIn(user, (err) => {
        if (err) {
          logger.error("[AuthController] Session error after login:", err);
          return res.status(500).json({ error: "Une erreur interne est survenue." });
        }
        res.status(200).json({
          message: "Connexion réussie",
          user: { id: user.id, email: user.email, pseudo: user.name },
        });
      });
    } catch (error) {
      logger.error("[AuthController] Login internal error:", error);
      res.status(500).json({ error: "Une erreur interne est survenue." });
    }
  }

  public logout(req: Request, res: Response): void {
    req.logOut((err) => {
      if (err) {
        logger.error("[AuthController] Logout error:", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de la déconnexion." });
      }
      res.status(200).json({ message: "Déconnexion réussie." });
    });
  }

  public me(req: Request, res: Response): void {
    const user = req.user as { id: string; email: string; name: string };
    res.status(200).json({ id: user.id, email: user.email, pseudo: user.name });
  }
}

export const authController = new AuthController();
