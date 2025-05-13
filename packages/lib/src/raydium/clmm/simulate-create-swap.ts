import assert from "assert";
import Decimal from "decimal.js";
import { format } from "@raliqbot/shared";
import { web3, BN } from "@coral-xyz/anchor";
import {
  PoolUtils,
  type ClmmKeys,
  type Raydium,
  type ComputeClmmPoolInfo,
  type ApiV3PoolInfoConcentratedItem,
  type ReturnTypeFetchMultiplePoolTickArrays,
} from "@raydium-io/raydium-sdk-v2";

import { isValidClmm } from "./utils";

type BasedSimulateCreateSwapParams = {
  slippage: number;
  swapPoolInfo?: {
    poolKeys?: ClmmKeys | undefined;
    clmmPoolInfo: ComputeClmmPoolInfo;
    poolInfo: ApiV3PoolInfoConcentratedItem;
    tickCache: ReturnTypeFetchMultiplePoolTickArrays | undefined;
  };
  epochInfo: web3.EpochInfo;
};

type SimulateCreateSwapParams = (
  | {
      outputMint: string;
      input: { mint: string; amount: number };
    }
  | { input: { amount: number }; poolId: string; side: "MintA" | "MintB" }
) &
  BasedSimulateCreateSwapParams;

export const simulateCreateSwap = async (
  raydium: Raydium,
  {
    slippage,
    epochInfo,
    input,
    swapPoolInfo,
    ...params
  }: SimulateCreateSwapParams
) => {
  assert(
    ("mint" in input && "outputMint" in params) || "poolId" in params,
    "provide input.mint & outputMint or poolId"
  );

  let poolKeys: ClmmKeys | undefined;
  let clmmPoolInfo: ComputeClmmPoolInfo | undefined;
  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;
  let tickCache: ReturnTypeFetchMultiplePoolTickArrays | undefined;

  if (swapPoolInfo) {
    poolInfo = swapPoolInfo.poolInfo;
    poolKeys = swapPoolInfo.poolKeys;
    tickCache = swapPoolInfo.tickCache;
    clmmPoolInfo = swapPoolInfo.clmmPoolInfo;
  } else {
    if (raydium.cluster === "mainnet") {
      if ("mint" in input && "outputMint" in params) {
        const pools = await raydium.api.fetchPoolByMints({
          mint1: input.mint,
          mint2: params.outputMint,
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
      }
    } else if ("poolId" in params) {
      const pool = await raydium.clmm.getPoolInfoFromRpc(params.poolId);
      poolInfo = pool.poolInfo;
      poolKeys = pool.poolKeys;
      tickCache = pool.tickData;
      clmmPoolInfo = pool.computePoolInfo;
    }
  }

  assert(poolInfo && tickCache && clmmPoolInfo);

  let baseIn = false;

  if ("mint" in input && "outputMint" in params) {
    assert(
      poolInfo && clmmPoolInfo && tickCache,
      format(
        "pool for mint1=% and mint2=% not found.",
        input.mint,
        params.outputMint
      )
    );

    assert(
      [poolInfo.mintA.address, poolInfo.mintB.address].includes(input.mint),
      format(
        "pool for mint1=% and mint2=% not found.",
        poolInfo.mintA.address,
        poolInfo.mintB.address
      )
    );

    baseIn = poolInfo.mintA.address === input.mint;
  } else if ("side" in params && "poolId" in params) {
    assert(
      poolInfo && clmmPoolInfo && tickCache,
      format("pool info for pool=% not found.", params.poolId)
    );

    baseIn = params.side === "MintA";
  }

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

    return [
      { minAmountOut, remainingAccounts, ...computedeData },
      { poolInfo, poolKeys, clmmPoolInfo, tickCache },
    ] as const;
  }

  throw new Error(
    format(
      "no valid pool found for mint1= and mint2=",
      poolInfo.mintA.address,
      poolInfo.mintB.address
    )
  );
};
