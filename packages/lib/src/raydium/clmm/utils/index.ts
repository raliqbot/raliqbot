import { readFileSync } from "fs";
import { web3 } from "@coral-xyz/anchor";
import { CLMM_PROGRAM_ID, DEVNET_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";

export * from "./get-positions";
export * from "./get-pool-info";
export * from "./create-pool-mint-ata";

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

export const devConfigs = [
  {
    id: "CQYbhr6amxUER4p5SC44C63R4qw4NFc9Z4Db9vF4tZwG",
    index: 0,
    protocolFeeRate: 120000,
    tradeFeeRate: 100,
    tickSpacing: 10,
    fundFeeRate: 40000,
    description: "Best for very stable pairs",
    defaultRange: 0.005,
    defaultRangePoint: [0.001, 0.003, 0.005, 0.008, 0.01],
  },
  {
    id: "B9H7TR8PSjJT7nuW2tuPkFC63z7drtMZ4LoCtD7PrCN1",
    index: 1,
    protocolFeeRate: 120000,
    tradeFeeRate: 2500,
    tickSpacing: 60,
    fundFeeRate: 40000,
    description: "Best for most pairs",
    defaultRange: 0.1,
    defaultRangePoint: [0.01, 0.05, 0.1, 0.2, 0.5],
  },
  {
    id: "GjLEiquek1Nc2YjcBhufUGFRkaqW1JhaGjsdFd8mys38",
    index: 3,
    protocolFeeRate: 120000,
    tradeFeeRate: 10000,
    tickSpacing: 120,
    fundFeeRate: 40000,
    description: "Best for exotic pairs",
    defaultRange: 0.1,
    defaultRangePoint: [0.01, 0.05, 0.1, 0.2, 0.5],
  },
  {
    id: "GVSwm4smQBYcgAJU7qjFHLQBHTc4AdB3F2HbZp6KqKof",
    index: 2,
    protocolFeeRate: 120000,
    tradeFeeRate: 500,
    tickSpacing: 10,
    fundFeeRate: 40000,
    description: "Best for tighter ranges",
    defaultRange: 0.1,
    defaultRangePoint: [0.01, 0.05, 0.1, 0.2, 0.5],
  },
];
