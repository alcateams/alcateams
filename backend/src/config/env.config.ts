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
  // Where Rainbow posts S2S events (which may carry message bodies). We don't consume them, so
  // point it at an endpoint we control; there is deliberately no default.
  RAINBOW_S2S_CALLBACK_URL: z.url("RAINBOW_S2S_CALLBACK_URL must be a valid URL"),
  // Message search. Leave both unset to run without indexing (e.g. in local development).
  MEILISEARCH_HOST: z.url("MEILISEARCH_HOST must be a valid URL").optional(),
  MEILISEARCH_API_KEY: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
