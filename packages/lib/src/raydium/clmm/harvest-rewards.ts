import { web3 } from "@coral-xyz/anchor";
import type {
  ApiV3PoolInfoConcentratedItem,
  ClmmPositionLayout,
  PositionInfoLayout,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import { getPoolsWithPositions } from "./utils";

export const harvestRewards = async (
  raydium: Raydium,
  programId: web3.PublicKey,
  prefetchedPositions: ReturnType<typeof PositionInfoLayout.decode>[]
) => {
  const allPositions = new Map<string, ClmmPositionLayout[]>();
  const allPoolInfo = new Map<string, ApiV3PoolInfoConcentratedItem>();

  const poolsWithPositions = await getPoolsWithPositions(
    raydium,
    programId,
    prefetchedPositions
  );

  for (const {
    pool: { poolInfo },
    positions,
  } of poolsWithPositions) {
    const pool = allPoolInfo.get(poolInfo.id);
    const allPosition = allPositions.get(poolInfo.id);

    if (!pool) allPoolInfo.set(poolInfo.id, poolInfo);
    if (allPosition) allPosition.push(...positions);
    else allPositions.set(poolInfo.id, positions);
  }

  console.log(
    "[claim.harvesting.processing] ",
    poolsWithPositions.flatMap(({ positions }) =>
      positions.map((position) => position.poolId.toBase58())
    )
  );

  const { execute } = await raydium.clmm.harvestAllRewards({
    allPositions: Object.fromEntries(allPositions.entries()),
    allPoolInfo: Object.fromEntries(allPoolInfo.entries()),
    ownerInfo: {
      useSOLBalance: true,
    },
  });

  const { txIds } = await execute({ sequentially: true, sendAndConfirm: true });

  console.log("[claim.harvesting.success] signatures=", txIds);

  return txIds;
};
