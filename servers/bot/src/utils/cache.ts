import type { Context } from "telegraf";
import { format } from "@raliqbot/shared";
import { DexScreener, getPortfolio, getPositions } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID, PoolFetchType } from "@raydium-io/raydium-sdk-v2";

export const getPoolInfoOrCachedPoolInfo = async (
  { raydium, session }: Context,
  ...address: string[]
) => {
  const cachedPoolInfos = session.cachedPoolInfos;

  const ids = address.join(",");
  const poolInfos = cachedPoolInfos[ids];
  if (poolInfos) return poolInfos;

  if (raydium.cluster === "mainnet") {
    const [mint1, mint2] = address;

    const poolInfos = (
      await Promise.all([
        raydium.api
          .fetchPoolByMints({
            mint1,
            mint2,
            sort: "fee24h",
            type: PoolFetchType.Concentrated,
          })
          .then((poolInfos) => poolInfos.data),
        raydium.api.fetchPoolById({
          ids,
        }),
      ])
    ).flat();

    session.cachedPoolInfos[ids] = poolInfos;

    return poolInfos;
  }

  const pool = await raydium.clmm
    .getPoolInfoFromRpc(address[0])
    .catch(() => null);
  if (pool) return [pool.poolInfo];

  throw new Error(format("poolInfo for id=% not found", address));
};

export const getPosiitionsOrCachedPositions = async (
  context: Context,
  dexscreener: DexScreener,
  programId = CLMM_PROGRAM_ID,
  ...positionIds: string[]
) => {
  const positions = [];
  const notFoundIds = [];

  for (const positionId of positionIds) {
    const cachedPosition = context.session.cachedPositions[positionId];
    if (cachedPosition) positions.push(cachedPosition);
    else notFoundIds.push(positionId);
  }

  if (notFoundIds.length > 0 || positionIds.length === 0) {
    const poolWithPositions = await getPositions(
      context.raydium,
      programId,
      ...notFoundIds
    );

    const porfolio = await getPortfolio(
      context.raydium,
      dexscreener,
      programId,
      poolWithPositions
    );

    for (const { pool, positions } of porfolio) {
      for (const position of positions) {
        context.session.cachedPositions[position.nftMint] = {
          ...position,
          poolInfo: pool.poolInfo,
        };
        positions.push(position);
      }
    }
  }

  return positions;
};
