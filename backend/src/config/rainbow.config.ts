import "../lib/dotenv";

// TODO: validate env variables at startup (fail-fast if one is missing) instead of the `?? ""` fallbacks that hide a missing config
export const rainbowConfig = {
  host: process.env.RAINBOW_HOST ?? "",
  appId: process.env.RAINBOW_APP_ID ?? "",
  appSecret: process.env.RAINBOW_APP_SECRET ?? "",
  adminEmail: process.env.RAINBOW_ADMIN_EMAIL ?? "",
  adminPassword: process.env.RAINBOW_ADMIN_PASSWORD ?? "",
};
