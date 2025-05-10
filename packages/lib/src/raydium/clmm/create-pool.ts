import Decimal from "decimal.js";
import { web3 } from "@coral-xyz/anchor";
import { Raydium, TxVersion } from "@raydium-io/raydium-sdk-v2";

const devConfigs = [
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

export const createPool = async (
  raydium: Raydium,
  tokenA: string,
  tokenB: string,
  programId: web3.PublicKey
) => {
  const mint1 = await raydium.token.getTokenInfo(tokenA);
  const mint2 = await raydium.token.getTokenInfo(tokenB);

  const [clmmConfig] =
    raydium.cluster === "mainnet"
      ? await raydium.api.getClmmConfigs()
      : devConfigs;

  const { execute, extInfo } = await raydium.clmm.createPool({
    programId,
    mint1,
    mint2,
    ammConfig: {
      ...clmmConfig,
      id: new web3.PublicKey(clmmConfig.id),
      fundOwner: "",
      description: "RaliqBot Devnet Liquidity",
    },
    initialPrice: new Decimal(1),
    txVersion: TxVersion.LEGACY,
  });

  const { txId } = await execute({ sendAndConfirm: true });
  return [txId, extInfo.address.id];
};
