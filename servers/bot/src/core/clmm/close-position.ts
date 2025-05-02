import {
  TxVersion,
  type ApiV3PoolInfoConcentratedItem,
  type ClmmKeys,
} from "@raydium-io/raydium-sdk-v2";

import { isValidClmm } from "./utils";
import type { Context } from "../context";

export const closePosition = async (
  { raydium }: Context,
  poolId: string,
  position: Awaited<
    ReturnType<typeof raydium.clmm.getOwnerPositionInfo>
  >[number]
) => {
  let poolKeys: ClmmKeys | undefined;
  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;

  switch (raydium.cluster) {
    case "devnet":
      {
        const rpcPoolInfo = await raydium.clmm.getPoolInfoFromRpc(poolId);
        poolInfo = rpcPoolInfo.poolInfo;
        poolKeys = rpcPoolInfo.poolKeys;
      }
      break;
    default:
      const apiPoolInfos = await raydium.api.fetchPoolById({ ids: poolId });
      for (const apiPoolInfo of apiPoolInfos) {
        if (isValidClmm(apiPoolInfo.programId)) {
          poolInfo = apiPoolInfo as ApiV3PoolInfoConcentratedItem;
          break;
        }
      }

      if (!poolInfo) throw new Error("target pool=% is not a CLMM pool");
  }

  const { execute } = await raydium.clmm.closePosition({
    poolInfo,
    poolKeys,
    ownerPosition: position,
    txVersion: TxVersion.LEGACY,
  });

  const { txId } = await execute({ sendAndConfirm: true });

  return txId;
};
