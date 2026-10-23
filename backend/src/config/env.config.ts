import "../lib/dotenv";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  RAINBOW_HOST: z.url("RAINBOW_HOST must be a valid URL"),
  RAINBOW_APP_ID: z.string().min(1, "RAINBOW_APP_ID is required"),
  RAINBOW_APP_SECRET: z.string().min(1, "RAINBOW_APP_SECRET is required"),
  RAINBOW_ADMIN_EMAIL: z.email("RAINBOW_ADMIN_EMAIL must be a valid email"),
  RAINBOW_ADMIN_PASSWORD: z.string().min(1, "RAINBOW_ADMIN_PASSWORD is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
