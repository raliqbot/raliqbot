import assert from "assert";
import { Decimal } from "decimal.js";
import { format } from "@raliqbot/shared";
import { BN, web3 } from "@coral-xyz/anchor";
import { PoolUtils, type Raydium, TickUtils } from "@raydium-io/raydium-sdk-v2";

import { createPoolMintAta } from "./utils";
import { getPool } from "./utils/get-pool";
import { getAllocateTokens } from "./utils/allocate-token";
import { simulateCreateSwap } from "./simulate-create-swap";

type CreatePositionParams = {
  poolId: string;
  slippage: number;
  rangeBias: boolean;
  range: [number, number];
  input: { mint?: string; amount: number };
  devConfig?: {
    tokenASwapConfig: { poolId: string };
    tokenBSwapConfig: { poolId: string };
  };
};

export const simulateCreatePosition = async (
  raydium: Raydium,
  epochInfo: web3.EpochInfo,
  {
    input,
    poolId,
    slippage,
    rangeBias,
    range: [startPercentage, endPercentage],
  }: CreatePositionParams
) => {
  assert(startPercentage > 0 || endPercentage > 0, "invalid tick percentage.");

  const singleSided: "MintA" | "MintB" | undefined =
    startPercentage === 0 ? "MintA" : endPercentage === 0 ? "MintB" : undefined;

  const { poolInfo, poolKeys } = await getPool(raydium, poolId);
  const ataSignature = await createPoolMintAta(raydium, poolInfo);

  if (ataSignature)
    console.log("[position.create.ataSignature] ", ataSignature);

  const baseIn = input.mint === poolInfo.mintA.address;
  const inputMintInPool =
    input.mint &&
    [poolInfo.mintA.address, poolInfo.mintB.address].includes(input.mint);

  let baseAmountIn: BN | undefined;
  let quoteAmountIn: BN | undefined;
  const swapPoolInfos = [];

  if (inputMintInPool) {
    const [swapAAmount, swapBAmount] = getAllocateTokens(
      [startPercentage, endPercentage],
      input.amount,
      rangeBias
    );

    console.log(
      "[position.swap.config] ",
      format("swapAAmount=% swapBAmount=%", swapAAmount, swapBAmount)
    );

    baseAmountIn = new BN(
      new Decimal(swapAAmount)
        .mul(Math.pow(10, poolInfo[baseIn ? "mintA" : "mintB"].decimals))
        .toFixed(0)
    );

    if (swapBAmount > 0) {
      const [{ minAmountOut: minBAmountOut }, swapPoolInfo] =
        await simulateCreateSwap(raydium, {
          slippage,
          epochInfo,
          input: {
            mint: poolInfo[baseIn ? "mintA" : "mintB"].address,
            amount: swapBAmount,
          },
          outputMint: poolInfo[baseIn ? "mintB" : "mintA"].address,
        });

      quoteAmountIn = minBAmountOut.amount.raw;

      swapPoolInfos.push([swapPoolInfo]);
    }
  } else {
    const [swapAAmount, swapBAmount] = getAllocateTokens(
      [startPercentage, endPercentage],
      input.amount,
      rangeBias
    );

    console.log(
      "[position.swap.config] ",
      format("swapAAmount=% swapBAmount=%", swapAAmount, swapBAmount)
    );

    if (swapAAmount > 0) {
      const [{ minAmountOut: minAAmountOut }, swapPoolInfo] =
        await simulateCreateSwap(raydium, {
          slippage,
          epochInfo,
          input: { mint: input.mint!, amount: swapAAmount },
          outputMint: poolInfo.mintA.address,
        });

      baseAmountIn = minAAmountOut.amount.raw;

      swapPoolInfos.push([swapPoolInfo]);
    }

    if (swapBAmount > 0) {
      const [{ minAmountOut: minBAmountOut }, swapPoolInfo] =
        await simulateCreateSwap(raydium, {
          slippage,
          epochInfo,
          input: { mint: input.mint!, amount: swapBAmount },
          outputMint: poolInfo.mintB.address,
        });

      quoteAmountIn = minBAmountOut.amount.raw;

      swapPoolInfos.push([swapPoolInfo]);
    }
  }

  assert(
    baseAmountIn || quoteAmountIn,
    "baseAmountIn and quoteAmountIn can't both be undefined"
  );

  console.log(
    "[position.swap.initialized] ",
    format(
      "baseAmountIn=% quoteAmountIn=%",
      baseAmountIn?.toString(),
      quoteAmountIn?.toString()
    )
  );

  poolInfo.price = (
    await raydium.clmm.getRpcClmmPoolInfo({
      poolId: poolInfo.id,
    })
  ).currentPrice;

  const startPrice = singleSided
    ? singleSided === "MintA"
      ? poolInfo.price + poolInfo.price * startPercentage
      : poolInfo.price - poolInfo.price * startPercentage
    : poolInfo.price - poolInfo.price * startPercentage;
  const endPrice = singleSided
    ? singleSided === "MintB"
      ? poolInfo.price - poolInfo.price * endPercentage
      : poolInfo.price + poolInfo.price * endPercentage
    : poolInfo.price + poolInfo.price * endPercentage;

  console.log(
    "[position.tick.config] ",
    format("startPrice=% endPrice=%", startPrice, endPrice)
  );

  let { tick: lowerTick } = TickUtils.getPriceAndTick({
    poolInfo,
    baseIn: singleSided
      ? singleSided === "MintA"
      : inputMintInPool
      ? baseIn
      : true,
    price: new Decimal(startPrice),
  });

  let { tick: upperTick } = TickUtils.getPriceAndTick({
    poolInfo,
    baseIn: singleSided
      ? singleSided === "MintA"
      : inputMintInPool
      ? baseIn
      : true,
    price: new Decimal(endPrice),
  });

  if (singleSided) {
    if (singleSided === "MintA" && lowerTick !== 0) lowerTick = 0;
    if (singleSided === "MintB" && upperTick !== 0) upperTick = 0;
  }

  console.log(
    "[position.tick.initialized] ",
    format("lowerTick=% upperTick=%", lowerTick, upperTick)
  );

  const baseAmount = singleSided
    ? baseAmountIn && !baseAmountIn.isZero()
      ? baseAmountIn
      : quoteAmountIn
    : inputMintInPool
    ? baseIn
      ? baseAmountIn
      : quoteAmountIn
    : baseAmountIn;

  const quoteAmount = singleSided
    ? undefined
    : inputMintInPool
    ? baseIn
      ? quoteAmountIn
      : baseAmountIn
    : quoteAmountIn;

  assert(baseAmount, "baseAmount can't be undefined");

  console.log(
    "[position.initialized] ",
    format(
      "baseAmount=% quoteAmount=%",
      baseAmount?.toString(),
      quoteAmount?.toString()
    )
  );

  const liquidityInfo = await PoolUtils.getLiquidityAmountOutFromAmountIn({
    poolInfo,
    epochInfo,
    add: true,
    slippage: 0,
    amountHasFee: true,
    amount: baseAmount!,
    inputA: singleSided
      ? singleSided === "MintA"
      : inputMintInPool
      ? baseIn
      : true,
    tickUpper: Math.max(lowerTick, upperTick),
    tickLower: Math.min(lowerTick, upperTick),
  });

  console.log(
    "[position.liquidity.info] ",
    format(
      "amountIn=% amountOut=% liquidity=%",
      liquidityInfo.amountSlippageA.amount.toString(),
      liquidityInfo.amountSlippageB.amount.toString(),
      liquidityInfo.liquidity.toString()
    )
  );

  const base = new Decimal(liquidityInfo.amountSlippageA.amount.toString());
  const quote = new Decimal(liquidityInfo.amountSlippageB.amount.toString());
  const total = base.plus(quote);

  const basePercentage = base.div(total).mul(100).toNumber();
  const quotePercentage = quote.div(total).mul(100).toNumber();

  console.log(
    "basePercentage=",
    basePercentage,
    "quotePercentage=",
    quotePercentage
  );

  return {
    upperTick,
    lowerTick,
    poolInfo,
    poolKeys,
    swapPoolInfos,
    basePercentage,
    quotePercentage,
    startPrice,
    endPrice,
    singleSided,
    baseIn,
    inputMintInPool,
  };
};
