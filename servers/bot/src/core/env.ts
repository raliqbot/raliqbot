import "dotenv/config";

import { format } from "@raliqbot/shared";

type Env = "CHANNNEL_ID"|"MEDIA_APP_URL"|"DEV_WALLET"|"BIRDEYE_API_KEY"|"DATABASE_URL"|"TELEGRAM_BOT_API_KEY"|"SECRET_KEY"|"BITQUERY_API_KEY"|"RPC_URL"|"WATCH_RPC_URL";

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
