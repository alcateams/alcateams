import { PrismaPg } from "@prisma/adapter-pg";
import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import { PrismaClient } from "./generated/prisma/client";

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;

const app = express();
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Route de test (Healthcheck)
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Le serveur Express fonctionne parfaitement !" });
});

// Route de test Prisma (à tester quand la DB sera connectée)
app.get("/api/users/count", async (req: Request, res: Response) => {
  try {
    // const count = await prisma.user.count(); // Décommenter quand la table User existera
    res.json({ message: "Prisma est prêt !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur de connexion à la base de données" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
