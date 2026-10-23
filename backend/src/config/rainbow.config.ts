import { env } from "./env.config";

export const rainbowConfig = {
  host: env.RAINBOW_HOST,
  appId: env.RAINBOW_APP_ID,
  appSecret: env.RAINBOW_APP_SECRET,
  adminEmail: env.RAINBOW_ADMIN_EMAIL,
  adminPassword: env.RAINBOW_ADMIN_PASSWORD,
};
