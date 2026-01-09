export const IS_SANDBOX =
  (process.env.GCZ_ENV || "production") === "sandbox";

export const TELEGRAM_BOT_TOKEN =
  IS_SANDBOX
    ? process.env.TELEGRAM_BOT_TOKEN_SANDBOX
    : process.env.TELEGRAM_BOT_TOKEN;

export const DATABASE_URL =
  IS_SANDBOX
    ? process.env.DATABASE_URL_AI
    : process.env.DATABASE_URL;
