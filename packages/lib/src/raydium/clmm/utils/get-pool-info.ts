import assert from "assert";
import { format } from "@raliqbot/shared";
import {
  PoolUtils,
  type ApiV3PoolInfoConcentratedItem,
  type ClmmKeys,
  type ComputeClmmPoolInfo,
  type Raydium,
  type ReturnTypeFetchMultiplePoolTickArrays,
} from "@raydium-io/raydium-sdk-v2";

import { isValidClmm } from ".";

export function getPoolInfo(
  raydium: Raydium,
  poolId: string
): Promise<{
  poolInfo: ApiV3PoolInfoConcentratedItem;
  poolKeys: ClmmKeys | undefined;
}>;
export function getPoolInfo(
  raydium: Raydium,
  poolId: string,
  withExtraInfo: boolean
): Promise<{
  poolInfo: ApiV3PoolInfoConcentratedItem;
  poolKeys: ClmmKeys | undefined;
  clmmPoolInfo: ComputeClmmPoolInfo;
  tickCache: ReturnTypeFetchMultiplePoolTickArrays;
}>;
export async function getPoolInfo(
  raydium: Raydium,
  poolId: string,
  withExtraInfo = false
) {
  let poolKeys: ClmmKeys | undefined;
  let clmmPoolInfo: ComputeClmmPoolInfo | undefined;
  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;
  let tickCache: ReturnTypeFetchMultiplePoolTickArrays | undefined;

  if (raydium.cluster === "mainnet") {
    const poolInfos = await raydium.api.fetchPoolById({ ids: poolId });
    for (const poolInfoItem of poolInfos)
      if (isValidClmm(poolInfoItem.programId)) {
        poolInfo = poolInfoItem as ApiV3PoolInfoConcentratedItem;
        if (withExtraInfo) {
          clmmPoolInfo = await PoolUtils.fetchComputeClmmInfo({
            connection: raydium.connection,
            poolInfo,
          });
          tickCache = await PoolUtils.fetchMultiplePoolTickArrays({
            connection: raydium.connection,
            poolKeys: [clmmPoolInfo],
          });
        }
        break;
      }
  } else {
    const pool = await raydium.clmm.getPoolInfoFromRpc(poolId);
    poolInfo = pool.poolInfo;
    poolKeys = pool.poolKeys;
    if (withExtraInfo) {
      tickCache = pool.tickData;
      clmmPoolInfo = pool.computePoolInfo;
    }
  }

  assert(poolInfo, format("target pool=% is not a CLMM pool", poolId));
  if (withExtraInfo) {
    assert(
      clmmPoolInfo && tickCache,
      format("clmmPoolInfo & tickCache is invalid for pool=%", poolId)
    );

    return { poolInfo, clmmPoolInfo, poolKeys, tickCache };
  }

  return { poolInfo, poolKeys };
}
