import "dotenv/config";

import { format } from "@raliqbot/shared";

type Env = "DEV_WALLET"|"DATABASE_URL"|"TELEGRAM_BOT_API_KEY"|"SECRET_KEY"|"BITQUERY_API_KEY";

export const getEnv = <T extends object | number | string | null = string>(
  name: Env,
  refine?: <K extends unknown>(value: K) => T
) => {
  const value = process.env["APP_" + name] || process.env[name] ;
  if (value)
    try {
      const parsed = JSON.parse(value) as T;
      return refine ? (refine(parsed) as T) : parsed;
    } catch {
      return (refine ? refine(value) : value) as T;
    }
  throw new Error(format("% not found in env file", name));
};
