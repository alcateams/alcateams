import { z } from "zod";

export const registerUserDto = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(12)
    .max(64)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/,
      "Le mot de passe doit contenir au moins 1 minuscule, 1 majuscule, 1 chiffre et 1 caractère spécial",
    ),
  pseudo: z.string().min(2).max(30),
});

export type RegisterUserRequest = z.infer<typeof registerUserDto>;
