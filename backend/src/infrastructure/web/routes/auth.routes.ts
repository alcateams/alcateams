import { Router } from "express";
import { authController } from "../controllers/auth.controller";

const router = Router();

// US-011: Inscription (Register)
router.post("/register", authController.register.bind(authController));

// US-012: Connexion (Login)
router.post("/login", authController.login.bind(authController));

export default router;
