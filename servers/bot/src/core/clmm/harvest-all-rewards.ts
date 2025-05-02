import { web3 } from "@coral-xyz/anchor";
import type {
  ApiV3PoolInfoConcentratedItem,
  ClmmPositionLayout,
} from "@raydium-io/raydium-sdk-v2";

import type { Context } from "../context";

export const harvestAllRewards = async (
  { raydium }: Context,
  programId: web3.PublicKey
) => {
  const positions = await raydium.clmm.getOwnerPositionInfo({ programId });
  const nonZeroPositions = positions.filter((position) =>
    position.liquidity.isZero()
  );

  let positionsPoolInfos: ApiV3PoolInfoConcentratedItem[] | null = null;
  const poolIds = nonZeroPositions.map((position) =>
    position.poolId.toBase58()
  );

  switch (raydium.cluster) {
    case "devnet":
      {
        positionsPoolInfos = await Promise.all(
          poolIds.map((poolId) =>
            raydium.clmm
              .getPoolInfoFromRpc(poolId)
              .then(({ poolInfo }) => poolInfo as ApiV3PoolInfoConcentratedItem)
          )
        );
      }
      break;
    default: {
      positionsPoolInfos = (await raydium.api.fetchPoolById({
        ids: poolIds.join(","),
      })) as ApiV3PoolInfoConcentratedItem[];
    }
  }

  const allPositions = nonZeroPositions.reduce((accumulator, current) => {
    const clmmPositions = accumulator[current.poolId.toBase58()];

    return {
      ...accumulator,
      [current.poolId.toBase58()]: clmmPositions
        ? clmmPositions.concat(current)
        : [current],
    };
  }, {} as Record<string, ClmmPositionLayout[]>);

  const { execute } = await raydium.clmm.harvestAllRewards({
    allPositions,
    allPoolInfo: positionsPoolInfos.reduce(
      (accumulator, current) => ({ ...accumulator, [current.id]: current }),
      {} as Record<string, ApiV3PoolInfoConcentratedItem>
    ),
    ownerInfo: {
      useSOLBalance: true,
    },
    programId,
  });

  const { txIds } = await execute({ sequentially: true, sendAndConfirm: true });

  return txIds;
};
