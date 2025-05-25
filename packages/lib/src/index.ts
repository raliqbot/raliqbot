import { web3 } from "@coral-xyz/anchor";

export * from "./api";
export * from "./bitquery";
export * from "./raydium";
export * from "./dexscreener";

export const isValidAddress = (address: string) => {
  try {
    new web3.PublicKey(address);
    return true;
  } catch {
    return false;
  }
};
