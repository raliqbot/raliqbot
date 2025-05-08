import type {
  ApiV3PoolInfoConcentratedItem,
  ClmmPositionLayout,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";
import { getPortfolio } from "./utils";

export const harvestRewards = async (
  raydium: Raydium,
  porfolio: Awaited<ReturnType<typeof getPortfolio>>
) => {
  const allPositions = new Map<string, ClmmPositionLayout[]>();
  const allPoolInfo = new Map<string, ApiV3PoolInfoConcentratedItem>();

  for (const {
    poolInfo: { poolInfo },
    positions,
  } of porfolio) {
    const pool = allPoolInfo.get(poolInfo.id);
    const allPosition = allPositions.get(poolInfo.id);

    if (!pool) allPoolInfo.set(poolInfo.id, poolInfo);
    if (allPosition) allPosition.push(...positions);
    else allPositions.set(poolInfo.id, positions);
  }

  console.log(
    "[claim.harvesting.processing] ",
    porfolio.map(({ positions }) =>
      positions.map((position) => position.poolId)
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
