import { readFileSync } from "fs";
import { web3 } from "@coral-xyz/anchor";

import { getEnv } from "./env";

export const format = <
  T extends Array<string | number | object | null | undefined>
>(
  delimiter: string,
  ...values: T
) => {
  return String(
    values.reduce(
      (result, value) =>
        String(result).replace(/(%|%d|%s)/, value ? value.toString() : ""),
      delimiter
    )
  );
};

export const loadWalletFromFile = (file: string) => {
  const key = readFileSync(file, "utf-8");
  return web3.Keypair.fromSecretKey(Buffer.from(Array.from(JSON.parse(key))));
};

export const buildMediaURL = (
  path: string,
  params?: Record<string, string>
) => {
  const mediaBaseURL = getEnv("MEDIA_APP_URL");

  const searchParams = new URLSearchParams({
    ...params,
    timestamp: Date.now().toString(),
  });
  return mediaBaseURL + path + "?" + searchParams.toString();
};
