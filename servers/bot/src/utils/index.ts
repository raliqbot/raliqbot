import { format } from "@raliqbot/shared";

export * from "./cache";
export * from "./pool-utils";

export const Explorer = {
  buildTxURL(signature: string) {
    return format("https://solscan.io/tx/%/", signature);
  },
};
