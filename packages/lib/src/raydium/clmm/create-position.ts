import assert from "assert";
import { Decimal } from "decimal.js";
import { format } from "@raliqbot/shared";
import { BN, web3 } from "@coral-xyz/anchor";
import {
  PoolUtils,
  type Raydium,
  TickUtils,
  TxVersion,
} from "@raydium-io/raydium-sdk-v2";

import { createPoolMintAta } from "./utils";
import { createSwap } from "./create-swap";
import { getPoolInfo } from "./utils/get-pool-info";

type CreatePositionParams = {
  poolId: string;
  slippage: number;
  range: [number, number];
  input: { mint?: string; amount: number };
  devConfig?: {
    tokenASwapConfig: { poolId: string };
    tokenBSwapConfig: { poolId: string };
  };
};

export const createPosition = async (
  raydium: Raydium,
  {
    input,
    poolId,
    slippage,
    range: [startPercentage, endPercentage],
  }: CreatePositionParams
) => {
  assert(startPercentage > 0 || endPercentage > 0, "invalid tick percentage.");

  const singleSided =
    startPercentage === 0 ? "MintA" : endPercentage === 0 ? "MintB" : undefined;

  const { poolInfo, poolKeys } = await getPoolInfo(raydium, poolId);
  const ataSignature = await createPoolMintAta(raydium, poolInfo);

  if (ataSignature)
    console.log("[position.create.ataSignature] ", ataSignature);

  const epochInfo = await raydium.fetchEpochInfo();
  const baseIn = input.mint === poolInfo.mintA.address;
  const inputMintInPool =
    input.mint &&
    [poolInfo.mintA.address, poolInfo.mintB.address].includes(input.mint);

  let baseAmountIn: BN | undefined;
  let quoteAmountIn: BN | undefined;
  const signers: web3.Signer[][] = [];
  const transactions: web3.Transaction[][] = [];

  if (inputMintInPool) {
    const percentageSum = startPercentage + endPercentage;
    const swapAAmount = (startPercentage / percentageSum) * input.amount;
    const swapBAmount = (endPercentage / percentageSum) * input.amount;

    baseAmountIn = new BN(
      new Decimal(swapAAmount)
        .mul(Math.pow(10, poolInfo[baseIn ? "mintA" : "mintB"].decimals))
        .toFixed(0)
    );

    if (swapBAmount > 0) {
      const [
        { minAmountOut: minBAmountOut },
        { transaction: swapBTransaction, signers: swapBSigners },
      ] = await createSwap(raydium, {
        slippage,
        epochInfo,
        input: { mint: input.mint!, amount: swapBAmount },
        outputMint: poolInfo[baseIn ? "mintB" : "mintA"].address,
      });

      quoteAmountIn = minBAmountOut.amount.raw;

      signers.push(swapBSigners);
      transactions.push([swapBTransaction]);
    }
  } else {
    const percentageSum = startPercentage + endPercentage;
    const swapAAmount = (startPercentage / percentageSum) * input.amount;
    const swapBAmount = (endPercentage / percentageSum) * input.amount;

    console.log(
      "[position.swap.config] ",
      format("swapAAmount=% swapBAmount=%", swapAAmount, swapBAmount)
    );

    if (swapAAmount > 0) {
      const [
        { minAmountOut: minAAmountOut },
        { transaction: swapATransaction, signers: swapASigners },
      ] = await createSwap(raydium, {
        slippage,
        epochInfo,
        input: { mint: input.mint!, amount: swapAAmount },
        outputMint: poolInfo.mintA.address,
      });

      baseAmountIn = minAAmountOut.amount.raw;

      signers.push(swapASigners);
      transactions.push([swapATransaction]);
    }

    if (swapBAmount > 0) {
      const [
        { minAmountOut: minBAmountOut },
        { transaction: swapBTransaction, signers: swapBSigners },
      ] = await createSwap(raydium, {
        slippage,
        epochInfo,
        input: { mint: input.mint!, amount: swapBAmount },
        outputMint: poolInfo.mintB.address,
      });

      quoteAmountIn = minBAmountOut.amount.raw;

      signers.push(swapBSigners);
      transactions.push([swapBTransaction]);
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
    ? baseAmountIn
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

  const otherAmountMax = singleSided
    ? singleSided === "MintA"
      ? liquidityInfo.amountSlippageB.amount
      : liquidityInfo.amountSlippageA.amount
    : inputMintInPool
    ? baseIn
      ? liquidityInfo.amountSlippageB.amount
      : liquidityInfo.amountSlippageA.amount
    : liquidityInfo.amountSlippageB.amount;

  if (quoteAmount)
    assert(
      quoteAmount.gt(otherAmountMax),
      "swap quote amount should be greater than amountIn, adjust ticks"
    );

  const {
    transaction: positionTransaction,
    extInfo,
    signers: positionSigners,
  } = await raydium.clmm.openPositionFromBase({
    poolInfo,
    poolKeys,
    baseAmount,
    otherAmountMax,
    base: singleSided
      ? singleSided
      : inputMintInPool
      ? baseIn
        ? "MintA"
        : "MintB"
      : "MintA",
    tickUpper: Math.max(lowerTick, upperTick),
    tickLower: Math.min(lowerTick, upperTick),
    ownerInfo: {
      useSOLBalance: true,
    },
    computeBudgetConfig: {
      units: 600000,
      microLamports: 100000,
    },
    txVersion: TxVersion.LEGACY,
  });

  const signatures: string[] = [];
  const [tx1, ...txs] = transactions;
  const [signers1, signers2] = signers;

  if (tx1 && tx1.length > 0) {
    const signature = await web3.sendAndConfirmTransaction(
      raydium.connection,
      new web3.Transaction().add(...tx1),
      signers1,
      { commitment: "confirmed" }
    );

    signatures.push(signature);
    console.log("[position.swapA.success] signature=", signature);
  }

  if (txs.flat().length > 0) {
    const signature = await web3.sendAndConfirmTransaction(
      raydium.connection,
      new web3.Transaction().add(...txs.flat()),
      signers2,
      { commitment: "confirmed" }
    );

    console.log("[position.swapB.success] signature=", signature);
    signatures.push(signature);
  }

  const signature = await web3.sendAndConfirmTransaction(
    raydium.connection,
    positionTransaction,
    [raydium.owner!.signer!, ...positionSigners],
    { commitment: "confirmed" }
  );

  signatures.push(signature);

  console.log("[position.created.success] signature=", signature);

  return [signatures, extInfo.nftMint.toBase58()] as const;
};
