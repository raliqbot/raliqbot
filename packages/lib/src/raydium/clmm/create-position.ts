import assert from "assert";
import { Decimal } from "decimal.js";
import { format } from "@raliqbot/shared";
import { BN, web3 } from "@coral-xyz/anchor";
import { PoolUtils, TxVersion, type Raydium } from "@raydium-io/raydium-sdk-v2";

import { createSwapOut } from "./create-swap-out";
import { simulateCreateSwap } from "./simulate-create-swap";
import { simulateCreatePosition } from "./simulate-create-position";

type CreatePositionParams = {
  poolId: string;
  slippage: number;
  rangeBias: boolean;
  range: [number, number];
  input: { mint: string; amount: number };
  skipSwapA?: boolean;
  skipSwapB?: boolean;
  devConfig?: {
    tokenASwapConfig: { poolId: string };
    tokenBSwapConfig: { poolId: string };
  };
};

export const createPosition = async (
  raydium: Raydium,
  params: CreatePositionParams,
  callbacks?: {
    onOpenPosition?: (signature: string) => void;
    onSwapA?: (signature: string, amount: number) => void;
    onSwapB?: (signature: string, amount: number) => void;
  }
) => {
  const { skipSwapA = false, skipSwapB = false } = params;
  const epochInfo = await raydium.fetchEpochInfo();

  const {
    basePercentage,
    quotePercentage,
    poolInfo,
    poolKeys,
    swapPoolInfos,
    baseIn,
    singleSided,
    inputMintInPool,
    upperTick,
    lowerTick,
  } = await simulateCreatePosition(raydium, epochInfo, params);

  const {
    input: { amount, mint },
    slippage,
  } = params;

  const swapAAmount = amount * (basePercentage / 100);
  const swapBAmount = amount * (quotePercentage / 100);

  let baseAmountIn;
  let quoteAmountIn;
  let baseSwapPoolInfo;
  let quoteSwapPoolInfo;
  const signers = [];
  const transactions = [];

  console.log(
    "[position.swap.config]",
    "swapAAmount=",
    swapAAmount,
    "swapBAmount=",
    swapBAmount
  );

  if (swapAAmount > 0 && inputMintInPool) {
    baseAmountIn = new BN(
      new Decimal(swapAAmount)
        .mul(Math.pow(10, poolInfo.mintA.decimals))
        .toFixed(0)
    );
  } else if (swapAAmount > 0) {
    const [swapPoolInfo] = swapPoolInfos.find((swapPoolInfo) =>
      swapPoolInfo.find(
        ({ poolInfo: { mintA, mintB } }) =>
          mintA.address === poolInfo.mintA.address ||
          mintB.address === poolInfo.mintA.address
      )
    )!;
    const [{ minAmountOut }] = await simulateCreateSwap(raydium, {
      ...swapPoolInfo,
      slippage,
      epochInfo,
      input: { mint: mint!, amount: swapAAmount },
      outputMint: poolInfo.mintA.address,
    });

    baseSwapPoolInfo = swapPoolInfo;
    baseAmountIn = minAmountOut.amount.raw;
  }

  if (swapBAmount > 0) {
    const [swapPoolInfo] = swapPoolInfos.find((swapPoolInfo) =>
      swapPoolInfo.find(
        ({ poolInfo: { mintA, mintB } }) =>
          mintA.address === poolInfo.mintB.address ||
          mintB.address === poolInfo.mintB.address
      )
    )!;

    const [{ minAmountOut }] = await simulateCreateSwap(raydium, {
      ...swapPoolInfo,
      slippage,
      epochInfo,
      input: { mint: mint!, amount: swapBAmount },
      outputMint: poolInfo.mintB.address,
    });

    quoteSwapPoolInfo = swapPoolInfo;
    quoteAmountIn = minAmountOut.amount.raw;
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
    await raydium.clmm.getRpcClmmPoolInfo({ poolId: poolInfo.id })
  ).currentPrice;

  const liquidityInfo = await PoolUtils.getLiquidityAmountOutFromAmountIn({
    poolInfo,
    epochInfo,
    add: true,
    slippage: 0,
    amountHasFee: true,
    amount: quoteAmountIn ? quoteAmountIn : baseAmountIn!,
    inputA: !quoteAmountIn,
    tickUpper: Math.max(lowerTick, upperTick),
    tickLower: Math.min(lowerTick, upperTick),
  });

  console.log(
    "[position.liquidity.info] ",
    format(
      "amountSlippageA=% amountSlippageB=% liquidity=%",
      liquidityInfo.amountSlippageA.amount.toString(),
      liquidityInfo.amountSlippageB.amount.toString(),
      liquidityInfo.liquidity.toString()
    )
  );

  if (baseSwapPoolInfo && !liquidityInfo.amountSlippageA.amount.isZero()) {
    const [
      { maxAmountIn },
      { transaction: swapATransaction, signers: swapASigners },
    ] = await createSwapOut(raydium, {
      ...baseSwapPoolInfo,
      slippage,
      epochInfo,
      input: { mint: mint!, amountOut: liquidityInfo.amountSlippageA.amount },
      outputMint: poolInfo.mintA.address,
    });

    signers.push(swapASigners);
    transactions.push([swapATransaction]);

    console.log(
      "[position.swap.config.reinitialized] swapAmountA=",
      new Decimal(maxAmountIn.amount.toString())
        .div(
          Math.pow(
            10,
            baseSwapPoolInfo.poolInfo[
              poolInfo.mintA.address === baseSwapPoolInfo.poolInfo.mintA.address
                ? "mintB"
                : "mintA"
            ].decimals
          )
        )
        .toNumber()
    );

    baseAmountIn = liquidityInfo.amountSlippageA.amount;
  }

  if (quoteSwapPoolInfo && !liquidityInfo.amountSlippageB.amount.isZero()) {
    const [
      { maxAmountIn },
      { transaction: swapBTransaction, signers: swapBSigners },
    ] = await createSwapOut(raydium, {
      ...quoteSwapPoolInfo,
      slippage,
      epochInfo,
      input: { mint: mint!, amountOut: liquidityInfo.amountSlippageB.amount },
      outputMint: poolInfo.mintB.address,
    });

    signers.push(swapBSigners);
    transactions.push([swapBTransaction]);

    console.log(
      "[position.swap.config.reinitialized] swapBmountN=",
      new Decimal(maxAmountIn.amount.toString())
        .div(
          Math.pow(
            10,
            quoteSwapPoolInfo.poolInfo[
              poolInfo.mintA.address ===
              quoteSwapPoolInfo.poolInfo.mintA.address
                ? "mintB"
                : "mintA"
            ].decimals
          )
        )
        .toNumber()
    );

    quoteAmountIn = liquidityInfo.amountSlippageB.amount;
  }

  const otherAmountMax = quoteAmountIn
    ? liquidityInfo.amountA.amount
    : liquidityInfo.amountB.amount;

  console.log(
    "[position.swap.reinitialized] ",
    format(
      "baseAmountIn=% quoteAmountIn=%",
      baseAmountIn?.toString(),
      quoteAmountIn?.toString()
    )
  );

  const {
    extInfo,
    signers: positionSigners,
    transaction: positionTransaction,
  } = await raydium.clmm.openPositionFromBase({
    poolInfo,
    poolKeys,
    otherAmountMax,
    baseAmount: quoteAmountIn
      ? quoteAmountIn.muln(90).divn(100)
      : baseAmountIn!,
    base: quoteAmountIn ? "MintB" : "MintA",
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

  if (!skipSwapA)
    if (tx1 && tx1.length > 0) {
      const transaction = new web3.Transaction().add(...tx1);
      const latestBlockHash = await raydium.connection.getLatestBlockhash();

      transaction.recentBlockhash = latestBlockHash.blockhash;
      transaction.lastValidBlockHeight = latestBlockHash.lastValidBlockHeight;

      const signature = await web3.sendAndConfirmTransaction(
        raydium.connection,
        transaction,
        signers1,
        { commitment: "confirmed" }
      );

      signatures.push(signature);
      console.log("[position.swapA.success] signature=", signature);

      if (callbacks && callbacks.onSwapA)
        callbacks.onSwapA(
          signature,
          new Decimal(baseAmountIn!.toString())
            .div(Math.pow(10, poolInfo.mintA.decimals))
            .toNumber()
        );
    }

  if (!skipSwapB)
    if (txs.flat().length > 0) {
      const transaction = new web3.Transaction().add(...txs.flat());
      const latestBlockHash = await raydium.connection.getLatestBlockhash();

      transaction.recentBlockhash = latestBlockHash.blockhash;
      transaction.lastValidBlockHeight = latestBlockHash.lastValidBlockHeight;

      const signature = await web3.sendAndConfirmTransaction(
        raydium.connection,
        transaction,
        signers2,
        { commitment: "confirmed" }
      );

      console.log("[position.swapB.success] signature=", signature);
      signatures.push(signature);

      if (callbacks && callbacks.onSwapB)
        callbacks.onSwapB(
          signature,
          new Decimal(quoteAmountIn!.toString())
            .div(Math.pow(10, poolInfo.mintB.decimals))
            .toNumber()
        );
    }

  const latestBlockHash = await raydium.connection.getLatestBlockhash();

  positionTransaction.recentBlockhash = latestBlockHash.blockhash;
  positionTransaction.lastValidBlockHeight =
    latestBlockHash.lastValidBlockHeight;

  const signature = await web3.sendAndConfirmTransaction(
    raydium.connection,
    positionTransaction,
    [raydium.owner!.signer!, ...positionSigners],
    { commitment: "confirmed" }
  );

  signatures.push(signature);
  console.log("[position.created.success] signature=", signature);

  if (callbacks && callbacks.onOpenPosition)
    callbacks.onOpenPosition(signature);

  return [
    signatures,
    extInfo.nftMint.toBase58(),
    {
      baseIn,
      singleSided,
      baseAmountIn,
      quoteAmountIn,
      upperTick,
      lowerTick,
      solAmountIn: amount,
      liquidity: liquidityInfo.liquidity,
    },
  ] as const;
};
