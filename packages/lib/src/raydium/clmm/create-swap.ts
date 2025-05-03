import assert from "assert";
import Decimal from "decimal.js";
import { format } from "@raliqbot/shared";
import { web3, BN } from "@coral-xyz/anchor";
import {
  PoolUtils,
  TxVersion,
  type ClmmKeys,
  type Raydium,
  type ComputeClmmPoolInfo,
  type ApiV3PoolInfoConcentratedItem,
  type ReturnTypeFetchMultiplePoolTickArrays,
} from "@raydium-io/raydium-sdk-v2";

import { isValidClmm } from "./utils";

export const createSwap = async (
  raydium: Raydium,
  input: { mint?: string; amount: number },
  outputMint: string,
  slippage: number,
  epochInfo: web3.EpochInfo,
  poolId?: string
) => {
  const inputMint = input.mint
    ? input.mint
    : "So11111111111111111111111111111111111111112";

  let poolKeys: ClmmKeys | undefined;
  let clmmPoolInfo: ComputeClmmPoolInfo | undefined;
  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;
  let tickCache: ReturnTypeFetchMultiplePoolTickArrays | undefined;

  if (raydium.cluster === "mainnet") {
    const pools = await raydium.api.fetchPoolByMints({
      mint1: inputMint,
      mint2: outputMint,
      sort: "liquidity",
    });

    for (const pool of pools.data) {
      if (isValidClmm(pool.programId)) {
        poolInfo = pool as ApiV3PoolInfoConcentratedItem;
        clmmPoolInfo = await PoolUtils.fetchComputeClmmInfo({
          connection: raydium.connection,
          poolInfo,
        });
        tickCache = await PoolUtils.fetchMultiplePoolTickArrays({
          connection: raydium.connection,
          poolKeys: [clmmPoolInfo],
        });
        break;
      }
    }
  } else if (poolId) {
    const pool = await raydium.clmm.getPoolInfoFromRpc(poolId);
    poolInfo = pool.poolInfo;
    poolKeys = pool.poolKeys;
    tickCache = pool.tickData;
    clmmPoolInfo = pool.computePoolInfo;
  }

  assert(
    poolInfo && clmmPoolInfo && tickCache,
    format("pool for mint1=% and mint2=% not found.", inputMint, outputMint)
  );

  assert(
    [poolInfo.mintA.address, poolInfo.mintB.address].includes(inputMint),
    format(
      "pool for mint1=% and mint2=% not found.",
      poolInfo.mintA.address,
      poolInfo.mintB.address
    )
  );

  const baseIn = poolInfo.mintA.address === inputMint;
  const amountIn = new BN(
    new Decimal(input.amount)
      .mul(Math.pow(10, poolInfo[baseIn ? "mintA" : "mintB"].decimals))
      .toFixed(0)
  );

  const tickArrayCache = tickCache[poolInfo.id];

  if (tickArrayCache) {
    const { minAmountOut, remainingAccounts, ...computedeData } =
      PoolUtils.computeAmountOutFormat({
        slippage,
        epochInfo,
        amountIn,
        tickArrayCache,
        poolInfo: clmmPoolInfo,
        tokenOut: poolInfo[baseIn ? "mintB" : "mintA"],
      });

    const swapResult = await raydium.clmm.swap({
      poolInfo,
      poolKeys,
      inputMint,
      amountIn,
      remainingAccounts,
      amountOutMin: minAmountOut.amount.raw,
      observationId: clmmPoolInfo.observationId,
      txVersion: TxVersion.LEGACY,
      ownerInfo: {
        useSOLBalance: true,
      },
    });

    return [
      { minAmountOut, remainingAccounts, ...computedeData },
      swapResult,
    ] as const;
  }

  return null;
};
