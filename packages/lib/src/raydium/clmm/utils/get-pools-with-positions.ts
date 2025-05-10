import { PublicKey } from "@solana/web3.js";
import {
  type ClmmKeys,
  type PositionInfoLayout,
  type ApiV3PoolInfoConcentratedItem,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import { getPool } from "./get-pool";

export const getPoolsWithPositions = async (
  raydium: Raydium,
  programId: PublicKey,
  prefetchedPositions?: Awaited<ReturnType<typeof PositionInfoLayout.decode>[]>
) => {
  const positions = prefetchedPositions
    ? prefetchedPositions
    : await raydium.clmm.getOwnerPositionInfo({ programId });

  const poolsWithPositions = new Map<
    string,
    {
      pool: {
        poolInfo: ApiV3PoolInfoConcentratedItem;
        poolKeys?: ClmmKeys;
      };
      positions: Awaited<ReturnType<typeof PositionInfoLayout.decode>[]>;
    }
  >();

  for (const position of positions) {
    const poolWithPositions = poolsWithPositions.get(
      position.poolId.toBase58()
    );
    if (poolWithPositions) poolWithPositions.positions.push(position);
    else {
      const pool = await getPool(raydium, position.poolId.toBase58());
      poolsWithPositions.set(position.poolId.toBase58(), {
        pool,
        positions: [position],
      });
    }
  }

  return Array.from(poolsWithPositions.values());
};
