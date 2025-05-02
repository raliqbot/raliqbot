import type { web3 } from "@coral-xyz/anchor";
import type { Raydium } from "@raydium-io/raydium-sdk-v2";

export type Context = {
  raydium: Raydium;
  payer: web3.Keypair;
  connection: web3.Connection;
};
