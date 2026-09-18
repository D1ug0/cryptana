import "dotenv/config";

const parseTelegramIds = (value = "") =>
  value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0);

export const appConfig = {
  telegramToken: process.env.TELEGRAM_TOKEN,
  definedApiKey: process.env.DEFINED_API_KEY,
  zerionApiKey: process.env.ZERION_API_KEY,
  allowedTelegramIds: parseTelegramIds(process.env.ALLOWED_TELEGRAM_IDS),
  database: {
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
  },
};

export const assertRuntimeConfig = () => {
  const required = {
    TELEGRAM_TOKEN: appConfig.telegramToken,
    DEFINED_API_KEY: appConfig.definedApiKey,
    ZERION_API_KEY: appConfig.zerionApiKey,
    ALLOWED_TELEGRAM_IDS: appConfig.allowedTelegramIds.length,
    DB_NAME: appConfig.database.name,
    DB_USER: appConfig.database.user,
    DB_PASSWORD: appConfig.database.password,
    DB_HOST: appConfig.database.host,
    DB_PORT: appConfig.database.port,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};
