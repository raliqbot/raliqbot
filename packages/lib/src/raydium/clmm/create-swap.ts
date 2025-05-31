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

type BasedCreateSwapParams = {
  slippage: number;
  epochInfo: web3.EpochInfo;
  poolKeys?: ClmmKeys | undefined;
  clmmPoolInfo: ComputeClmmPoolInfo;
  poolInfo: ApiV3PoolInfoConcentratedItem;
  tickCache: ReturnTypeFetchMultiplePoolTickArrays;
};

type CreateSwapParams = (
  | {
      outputMint: string | web3.PublicKey;
      input: { mint: string | web3.PublicKey; amount: number | bigint };
    }
  | {
      input: { amount: number | bigint };
      poolId: string;
      side: "MintA" | "MintB";
    }
) &
  BasedCreateSwapParams;

export const createSwap = async (
  raydium: Raydium,
  {
    slippage,
    epochInfo,
    input,
    poolInfo,
    poolKeys,
    clmmPoolInfo,
    tickCache,
    ...params
  }: CreateSwapParams
) => {
  assert(
    ("mint" in input && "outputMint" in params) || "poolId" in params,
    "provide input.mint & outputMint or poolId"
  );

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
      [poolInfo.mintA.address, poolInfo.mintB.address].includes(
        input.mint instanceof web3.PublicKey
          ? input.mint.toBase58()
          : input.mint
      ),
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

  const amountIn =
    typeof input.amount === "bigint"
      ? new BN(input.amount.toString())
      : new BN(
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
      amountIn,
      remainingAccounts,
      txVersion: TxVersion.LEGACY,
      amountOutMin: minAmountOut.amount.raw,
      observationId: clmmPoolInfo.observationId,
      inputMint: poolInfo[baseIn ? "mintA" : "mintB"].address,
      ownerInfo: {
        useSOLBalance: true,
      },
    });

    return [
      { minAmountOut, remainingAccounts, ...computedeData },
      swapResult,
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
