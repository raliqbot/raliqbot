import assert from "assert";
import { Decimal } from "decimal.js";
import { format } from "@raliqbot/shared";
import { BN, web3 } from "@coral-xyz/anchor";
import {
  PoolUtils,
  type ApiV3PoolInfoConcentratedItem,
  type ClmmKeys,
  type Raydium,
  TickUtils,
  TxVersion,
} from "@raydium-io/raydium-sdk-v2";

import { isValidClmm } from "./utils";
import { createSwap } from "./create-swap";

export const createPosition = async (
  raydium: Raydium,
  input: { mint?: string; amount: number },
  poolId: string,
  [startPrice, endPrice]: [number, number],
  slippage: number,
  devConfig?: {
    tokenASwapConfig: { poolId: string };
    tokenBSwapConfig: { poolId: string };
  }
) => {
  let poolKeys: ClmmKeys | undefined;
  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;

  if (raydium.cluster === "mainnet") {
    const poolInfos = await raydium.api.fetchPoolById({ ids: poolId });
    for (const poolInfoItem of poolInfos)
      if (isValidClmm(poolInfoItem.programId)) {
        poolInfo = poolInfoItem as ApiV3PoolInfoConcentratedItem;
        break;
      }
  } else {
    const pool = await raydium.clmm.getPoolInfoFromRpc(poolId);
    poolInfo = pool.poolInfo;
    poolKeys = pool.poolKeys;
  }

  assert(poolInfo, format("target pool=% is not a CLMM pool", poolId));

  const epochInfo = await raydium.fetchEpochInfo();
  const baseIn = input.mint === poolInfo.mintA.address;
  const inputMintInPool =
    input.mint &&
    [poolInfo.mintA.address, poolInfo.mintB.address].includes(input.mint);

  let baseAmountIn;
  let quoteAmountIn;
  const signers: web3.Signer[] = [];
  const transactions: web3.Transaction[][] = [];

  if (inputMintInPool) {
    baseAmountIn = new BN(
      new Decimal(input.amount)
        .div(2)
        .mul(Math.pow(10, poolInfo[baseIn ? "mintA" : "mintB"].decimals))
        .toFixed(0)
    );

    const swapResult = await createSwap(
      raydium,
      { mint: input.mint, amount: input.amount / 2 },
      poolInfo[baseIn ? "mintB" : "mintA"].address,
      slippage,
      epochInfo,
      devConfig?.[baseIn ? "tokenBSwapConfig" : "tokenASwapConfig"].poolId
    );

    if (swapResult) {
      const [{ minAmountOut }, { transaction, signers: swapSigners }] =
        swapResult;

      signers.push(...swapSigners);
      transactions.push([transaction]);

      quoteAmountIn = minAmountOut.amount.raw;
    } else
      baseAmountIn = new BN(
        new Decimal(input.amount)
          .mul(Math.pow(10, poolInfo[baseIn ? "mintA" : "mintB"].decimals))
          .toFixed(0)
      );
  } else {
    const swapAResult = await createSwap(
      raydium,
      { mint: input.mint, amount: input.amount * 0.45 },
      poolInfo.mintA.address,
      slippage,
      epochInfo,
      devConfig?.tokenASwapConfig.poolId
    );
    const swapBResult = await createSwap(
      raydium,
      { mint: input.mint, amount: input.amount * 0.55 },
      poolInfo.mintB.address,
      slippage,
      epochInfo,
      devConfig?.tokenBSwapConfig.poolId
    );

    if (swapAResult) {
      const [{ minAmountOut }, { transaction, signers: swapSigners }] =
        swapAResult;

      signers.push(...swapSigners);
      transactions.push([transaction]);

      baseAmountIn = minAmountOut.amount.raw;
    }

    if (swapBResult) {
      const [{ minAmountOut }, { transaction, signers: swapSigners }] =
        swapBResult;

      signers.push(...swapSigners);
      transactions.push([transaction]);
      quoteAmountIn = minAmountOut.amount.raw;
    }

    assert(
      swapAResult && swapBResult,
      format(
        "single sided liquidity not supported for these mints mint1=% mint2=%",
        poolInfo.mintA.address,
        poolInfo.mintB.address
      )
    );
  }

  const rpcPoolInfo = await raydium.clmm.getRpcClmmPoolInfo({
    poolId: poolInfo.id,
  });
  poolInfo.price = rpcPoolInfo.currentPrice;

  const { tick: lowerTick } = TickUtils.getPriceAndTick({
    poolInfo,
    baseIn: inputMintInPool ? baseIn : true,
    price: new Decimal(startPrice),
  });

  const { tick: upperTick } = TickUtils.getPriceAndTick({
    poolInfo,
    baseIn: inputMintInPool ? baseIn : true,
    price: new Decimal(endPrice),
  });

  if (baseAmountIn)
    baseAmountIn = baseAmountIn.mul(new BN(70)).div(new BN(100));

  const liquidityInfo = await PoolUtils.getLiquidityAmountOutFromAmountIn({
    poolInfo,
    epochInfo,
    add: true,
    slippage: 0,
    amountHasFee: true,
    amount: inputMintInPool
      ? baseIn
        ? baseAmountIn!
        : quoteAmountIn!
      : baseAmountIn!,
    inputA: inputMintInPool ? baseIn : true,
    tickUpper: Math.max(lowerTick, upperTick),
    tickLower: Math.min(lowerTick, upperTick),
  });

  const {
    transaction: positionTransaction,
    extInfo,
    signers: positionSigners,
  } = await raydium.clmm.openPositionFromBase({
    poolInfo,
    poolKeys,
    base: inputMintInPool ? (baseIn ? "MintA" : "MintB") : "MintA",
    baseAmount: inputMintInPool
      ? baseIn
        ? baseAmountIn!
        : quoteAmountIn!
      : baseAmountIn!,
    otherAmountMax: inputMintInPool
      ? baseIn
        ? liquidityInfo.amountSlippageB.amount
        : liquidityInfo.amountSlippageA.amount
      : liquidityInfo.amountSlippageB.amount,
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

  const [tx1, ...txs] = transactions;

  const swapASignature = await web3.sendAndConfirmTransaction(
    raydium.connection,
    new web3.Transaction().add(...tx1),
    [...signers],
    { commitment: "confirmed" }
  );

  console.log("swap_a_signature=", swapASignature);

  const swapBSignature = await web3.sendAndConfirmTransaction(
    raydium.connection,
    new web3.Transaction().add(...txs.flat()),
    [...signers],
    { commitment: "confirmed" }
  );

  console.log("swap_b_signature=", swapBSignature);

  const positionnSignature = await web3.sendAndConfirmTransaction(
    raydium.connection,
    positionTransaction,
    [raydium.owner!.signer!, ...positionSigners],
    { commitment: "confirmed" }
  );

  console.log("position_signature=", positionnSignature);

  return [
    [swapASignature, swapBSignature, positionnSignature],
    extInfo.nftMint.toBase58(),
  ] as const;
};
