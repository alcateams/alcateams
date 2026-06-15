import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth.controller";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

// US-011: Inscription (Register)
router.post("/register", authController.register.bind(authController));

// US-012: Connexion (Login)
router.post("/login", authController.login.bind(authController));

export default router;
