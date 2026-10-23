import { z } from "zod";

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export const updateUserDto = z
  .object({
    pseudo: z
      .string()
      .trim()
      .min(2, "Le pseudo doit contenir au moins 2 caractères")
      .max(30, "Le pseudo ne peut pas dépasser 30 caractères"),

    email: z.string().trim().toLowerCase().pipe(z.email("Email invalide")),

    bio: z.string().trim().max(160, "La bio ne peut pas dépasser 160 caractères").nullable(),

    urls: z
      .array(
        z
          .string()
          .trim()
          .max(2048, "URL trop longue")
          .refine(isHttpUrl, "Seules les URLs http(s) sont acceptées"),
      )
      .max(5, "5 liens maximum"),
  })
  .strict();

export type UpdateUserRequest = z.infer<typeof updateUserDto>;
