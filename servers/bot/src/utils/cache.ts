import { Context } from "telegraf";
import DLMM from "@meteora-ag/dlmm";
import { PublicKey } from "@solana/web3.js";

export const getPool = async (
  context: Pick<Context, "session" | "connection">,
  poolId: string
) => {
  if (!context.session.pools[poolId])
    context.session.pools[poolId] = await DLMM.create(
      context.connection,
      new PublicKey(poolId)
    );

  return context.session.pools[poolId];
};

export const getPoolWithPositions = async (
  context: Pick<Context, "session" | "connection" | "wallet">,
  ...positions: string[]
) => {
  const getCachedPositions = (single?: boolean) => {
    const results = [];
    const poolWithPositions = Object.values(
      context.session.cachedPoolWithPositions
    );
    for (const { pool, positions: cachedPositions } of poolWithPositions) {
      const cachedPosition = cachedPositions.filter(({ publicKey }) =>
        positions.some((position) => publicKey.equals(new PublicKey(position)))
      );
      if (cachedPosition.length > 0)
        results.push({ pool, positions: cachedPosition });

      if (single) break;
    }

    return results;
  };

  if (positions.length < 2) return getCachedPositions(true);

  const positionInfos = await DLMM.getAllLbPairPositionsByUser(
    context.connection,
    context.wallet.publicKey
  );

  for (const [poolId, positionInfo] of positionInfos) {
    const pool = await DLMM.create(context.connection, positionInfo.publicKey);
    context.session.cachedPoolWithPositions[poolId] = {
      pool,
      positions: positionInfo.lbPairPositionsData,
    };
  }

  if (positions.length < 1)
    return Object.values(context.session.cachedPoolWithPositions);

  return getCachedPositions();
};
