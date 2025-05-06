import assert from "assert";
import { format } from "@raliqbot/shared";
import {
  TxVersion,
  type Raydium,
  type ApiV3PoolInfoConcentratedItem,
  type ClmmKeys,
} from "@raydium-io/raydium-sdk-v2";

import { isValidClmm } from "./utils";

export const closePosition = async (
  raydium: Raydium,
  position: Awaited<
    ReturnType<typeof raydium.clmm.getOwnerPositionInfo>
  >[number]
) => {
  let poolKeys: ClmmKeys | undefined;
  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;

  if (raydium.cluster === "mainnet") {
    const apiPoolInfos = await raydium.api.fetchPoolById({
      ids: position.poolId.toBase58(),
    });
    for (const apiPoolInfo of apiPoolInfos) {
      if (isValidClmm(apiPoolInfo.programId)) {
        poolInfo = apiPoolInfo as ApiV3PoolInfoConcentratedItem;
        break;
      }
    }
  } else {
    const rpcPoolInfo = await raydium.clmm.getPoolInfoFromRpc(
      position.poolId.toBase58()
    );
    poolInfo = rpcPoolInfo.poolInfo;
    poolKeys = rpcPoolInfo.poolKeys;
  }

  assert(poolInfo, format("target pool=% is not a CLMM pool", position.poolId));

  const { execute } = await raydium.clmm.closePosition({
    poolInfo,
    poolKeys,
    ownerPosition: position,
    txVersion: TxVersion.LEGACY,
  });

  const { txId } = await execute({ sendAndConfirm: true });

  return txId;
};
