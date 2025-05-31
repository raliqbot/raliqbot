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

export function getPoolByMints(
  raydium: Raydium,
  mints: (string | web3.PublicKey)[]
): Promise<{
  poolInfo: ApiV3PoolInfoConcentratedItem;
  poolKeys: ClmmKeys | undefined;
}>;
export function getPoolByMints(
  raydium: Raydium,
  mints: (string | web3.PublicKey)[],
  withExtraInfo: boolean
): Promise<{
  poolInfo: ApiV3PoolInfoConcentratedItem;
  poolKeys: ClmmKeys | undefined;
  clmmPoolInfo: ComputeClmmPoolInfo;
  tickCache: ReturnTypeFetchMultiplePoolTickArrays;
}>;
export async function getPoolByMints(
  raydium: Raydium,
  mints: (string | web3.PublicKey)[],
  withExtraInfo = false
) {
  let poolKeys: ClmmKeys | undefined;
  let clmmPoolInfo: ComputeClmmPoolInfo | undefined;
  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;
  let tickCache: ReturnTypeFetchMultiplePoolTickArrays | undefined;

  if (raydium.cluster === "mainnet") {
    const [mint1, mint2] = mints;
    const props: Parameters<typeof raydium.api.fetchPoolByMints>[number] = {
      mint1,
    };
    if (mint2) props.mint2 = mint2;
    const poolInfos = await raydium.api.fetchPoolByMints(props);

    for (const poolInfoItem of poolInfos.data)
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
  } else throw new Error("this function can't be used in devnet");

  assert(poolInfo, format("target mints=% is not a CLMM pool", mints));
  if (withExtraInfo) {
    assert(
      clmmPoolInfo && tickCache,
      format("clmmPoolInfo & tickCache is invalid for mints=%", mints)
    );

    return { poolInfo, clmmPoolInfo, poolKeys, tickCache };
  }

  return { poolInfo, poolKeys };
}
