import type { Context } from "telegraf";
import { format } from "@raliqbot/shared";
import { PoolFetchType } from "@raydium-io/raydium-sdk-v2";

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
