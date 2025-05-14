import { readFileSync } from "fs";
import { web3 } from "@coral-xyz/anchor";
import { CLMM_PROGRAM_ID, DEVNET_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";

export * from "./get-pool";
export * from "./get-portfolio";
export * from "./allocate-token";
export * from "./create-pool-mint-ata";
export * from "./get-pools-with-positions";
export * from "./get-pool-with-positions-by-wallets";

const VALID_PROGRAM_ID = new Set([
  CLMM_PROGRAM_ID.toBase58(),
  DEVNET_PROGRAM_ID.CLMM.toBase58(),
]);

export const isValidClmm = (id: string | web3.PublicKey) =>
  VALID_PROGRAM_ID.has(id instanceof web3.PublicKey ? id.toBase58() : id);

export const loadWalletFromFile = (file: string) => {
  const key = readFileSync(file, "utf-8");
  return web3.Keypair.fromSecretKey(Buffer.from(Array.from(JSON.parse(key))));
};

export const isNativeAddress = (value: string) =>
  new web3.PublicKey(value).equals(
    new web3.PublicKey("So11111111111111111111111111111111111111112")
  );

export const stableCoins = [];
