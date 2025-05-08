import { PublicKey } from "@solana/web3.js";
import {
  type ClmmKeys,
  type ApiV3PoolInfoConcentratedItem,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";
import { getPoolInfo } from "./get-pool-info";

export const getPortfolio = async (
  raydium: Raydium,
  programId: PublicKey,
  filteredPositions?: Awaited<
    ReturnType<typeof raydium.clmm.getOwnerPositionInfo>
  >
) => {
  const positions = filteredPositions
    ? filteredPositions
    : await raydium.clmm.getOwnerPositionInfo({ programId });

  const poolsWithPositions = new Map<
    string,
    {
      poolInfo: {
        poolInfo: ApiV3PoolInfoConcentratedItem;
        poolKeys?: ClmmKeys;
      };
      positions: Awaited<ReturnType<typeof raydium.clmm.getOwnerPositionInfo>>;
    }
  >();

  for (const position of positions) {
    const poolWithPositions = poolsWithPositions.get(
      position.poolId.toBase58()
    );
    if (poolWithPositions) poolWithPositions.positions.push(position);
    else {
      const poolInfo = await getPoolInfo(raydium, position.poolId.toBase58());
      poolsWithPositions.set(position.poolId.toBase58(), {
        poolInfo,
        positions: [position],
      });
    }
  }

  return Array.from(poolsWithPositions.values());
};
