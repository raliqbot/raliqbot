import assert from "assert";
import { web3 } from "@coral-xyz/anchor";
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

export function getPoolById(
  raydium: Raydium,
  poolId: string | web3.PublicKey
): Promise<{
  poolInfo: ApiV3PoolInfoConcentratedItem;
  poolKeys: ClmmKeys | undefined;
}>;
export function getPoolById(
  raydium: Raydium,
  poolId: string | web3.PublicKey,
  withExtraInfo: boolean
): Promise<{
  poolInfo: ApiV3PoolInfoConcentratedItem;
  poolKeys: ClmmKeys | undefined;
  clmmPoolInfo: ComputeClmmPoolInfo;
  tickCache: ReturnTypeFetchMultiplePoolTickArrays;
}>;
export async function getPoolById(
  raydium: Raydium,
  poolId: string | web3.PublicKey,
  withExtraInfo = false
) {
  let poolKeys: ClmmKeys | undefined;
  let clmmPoolInfo: ComputeClmmPoolInfo | undefined;
  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;
  let tickCache: ReturnTypeFetchMultiplePoolTickArrays | undefined;

  if (raydium.cluster === "mainnet") {
    const poolInfos = await raydium.api.fetchPoolById({ ids: poolId.toString() });
    
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
    const pool = await raydium.clmm.getPoolInfoFromRpc(poolId.toString());
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
