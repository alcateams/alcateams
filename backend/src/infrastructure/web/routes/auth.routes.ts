import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../../../middlewares/requireAuth.middleware";

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

// US-012: Déconnexion (Logout)
router.post("/logout", authController.logout.bind(authController));

// US-014: Consulter mon profil (View profile)
router.get("/me", requireAuth, authController.me.bind(authController));
export default router;
