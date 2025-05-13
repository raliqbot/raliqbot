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
  outputMint: string;
  poolKeys?: ClmmKeys | undefined;
  clmmPoolInfo: ComputeClmmPoolInfo;
  poolInfo: ApiV3PoolInfoConcentratedItem;
  tickCache: ReturnTypeFetchMultiplePoolTickArrays;
};

type CreateSwapParams = (
  | {
      input: { mint: string; amountOut: BN };
    }
  | { input: { amountOut: BN }; poolId: string; side: "MintA" | "MintB" }
) &
  BasedCreateSwapParams;

export const createSwapOut = async (
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

  const tickArrayCache = tickCache[poolInfo.id];

  if (tickArrayCache) {
    const { maxAmountIn, realAmountOut, remainingAccounts, ...computedeData } =
      PoolUtils.computeAmountIn({
        slippage,
        epochInfo,
        tickArrayCache,
        amountOut: input.amountOut,
        baseMint: new web3.PublicKey(params.outputMint),
        poolInfo: clmmPoolInfo,
      });

    const swapResult = await raydium.clmm.swapBaseOut({
      poolInfo,
      poolKeys,
      remainingAccounts,
      outputMint: params.outputMint,
      amountInMax: maxAmountIn.amount,
      amountOut: realAmountOut.amount,
      txVersion: TxVersion.LEGACY,
      observationId: clmmPoolInfo.observationId,
      ownerInfo: {
        useSOLBalance: true,
      },
    });

    return [
      { maxAmountIn, remainingAccounts, ...computedeData },
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
