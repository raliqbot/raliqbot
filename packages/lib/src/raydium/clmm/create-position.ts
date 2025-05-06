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

type CreatePositionParams = {
  poolId: string;
  slippage: number;
  tickPercentage: [number, number];
  singleSided?: "MintA" | "MintB";
  input: { mint?: string; amount: number };
  devConfig?: {
    tokenASwapConfig: { poolId: string };
    tokenBSwapConfig: { poolId: string };
  };
};

export const createPosition = async (
  raydium: Raydium,
  {
    poolId,
    slippage,
    tickPercentage: [startPercentage, endPercentage],
    singleSided,
    input,
    devConfig,
  }: CreatePositionParams
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

    const [{ minAmountOut }, { transaction, signers: swapSigners }] =
      await createSwap(
        raydium,
        {
          mint: input.mint,
          amount: singleSided ? input.amount : input.amount / 2,
        },
        poolInfo[baseIn ? "mintB" : "mintA"].address,
        slippage,
        epochInfo,
        devConfig?.[baseIn ? "tokenBSwapConfig" : "tokenASwapConfig"].poolId
      );

    signers.push(...swapSigners);
    transactions.push([transaction]);
    quoteAmountIn = minAmountOut.amount.raw;
  } else {
    {
      const [{ minAmountOut }, { transaction, signers: swapSigners }] =
        await createSwap(
          raydium,
          {
            mint: input.mint,
            amount: singleSided ? input.amount * 0.9 : input.amount * 0.45,
          },
          poolInfo.mintA.address,
          slippage,
          epochInfo,
          devConfig?.tokenASwapConfig.poolId
        );

      signers.push(...swapSigners);
      transactions.push([transaction]);

      baseAmountIn = minAmountOut.amount.raw;
    }

    {
      const swapBResult = await createSwap(
        raydium,
        {
          mint: input.mint,
          amount: singleSided ? input.amount * 0.1 : input.amount * 0.55,
        },
        poolInfo.mintB.address,
        slippage,
        epochInfo,
        devConfig?.tokenBSwapConfig.poolId
      );
      const [{ minAmountOut }, { transaction, signers: swapSigners }] =
        swapBResult;

      signers.push(...swapSigners);
      transactions.push([transaction]);
      quoteAmountIn = minAmountOut.amount.raw;
    }
  }

  const rpcPoolInfo = await raydium.clmm.getRpcClmmPoolInfo({
    poolId: poolInfo.id,
  });
  poolInfo.price = rpcPoolInfo.currentPrice;

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

  const { tick: lowerTick } = TickUtils.getPriceAndTick({
    poolInfo,
    baseIn: singleSided
      ? singleSided === "MintA"
      : inputMintInPool
      ? baseIn
      : true,
    price: new Decimal(startPrice),
  });

  const { tick: upperTick } = TickUtils.getPriceAndTick({
    poolInfo,
    baseIn: singleSided
      ? singleSided === "MintA"
      : inputMintInPool
      ? baseIn
      : true,
    price: new Decimal(endPrice),
  });

  if (!singleSided && baseAmountIn)
    baseAmountIn = baseAmountIn.mul(new BN(70)).div(new BN(100));

  const baseAmount = singleSided
    ? singleSided === "MintA"
      ? baseAmountIn!
      : quoteAmountIn!
    : inputMintInPool
    ? baseIn
      ? baseAmountIn!
      : quoteAmountIn!
    : baseAmountIn!;

  const liquidityInfo = await PoolUtils.getLiquidityAmountOutFromAmountIn({
    poolInfo,
    epochInfo,
    add: true,
    slippage: 0,
    amountHasFee: true,
    amount: baseAmount,
    inputA: singleSided
      ? singleSided === "MintA"
      : inputMintInPool
      ? baseIn
      : true,
    tickUpper: Math.max(lowerTick, upperTick),
    tickLower: Math.min(lowerTick, upperTick),
  });

  console.log("startPrice=", startPrice);
  console.log("endPrice=", endPrice);
  console.log("singleSided=", singleSided === "MintA");
  console.log("singleSided=", singleSided);
  console.log("baseAmount=", baseAmount.toString());
  console.log("baseAmount=", liquidityInfo.amountSlippageA.amount.toString());
  console.log("quoteAmount=", liquidityInfo.amountSlippageB.amount.toString());

  const {
    transaction: positionTransaction,
    extInfo,
    signers: positionSigners,
  } = await raydium.clmm.openPositionFromBase({
    poolInfo,
    poolKeys,
    baseAmount,
    base: singleSided
      ? singleSided
      : inputMintInPool
      ? baseIn
        ? "MintA"
        : "MintB"
      : "MintA",
    otherAmountMax: singleSided
      ? singleSided === "MintA"
        ? liquidityInfo.amountSlippageB.amount
        : liquidityInfo.amountSlippageA.amount
      : inputMintInPool
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

  const signatures: string[] = [];
  const [tx1, ...txs] = transactions;

  const swap1Signature = await web3.sendAndConfirmTransaction(
    raydium.connection,
    new web3.Transaction().add(...tx1),
    [...signers],
    { commitment: "confirmed" }
  );

  signatures.push(swap1Signature);
  console.log("swap_1_signature=", swap1Signature);

  let swap2ignature;

  if (txs.flat().length > 0) {
    const swap2Signature = await web3.sendAndConfirmTransaction(
      raydium.connection,
      new web3.Transaction().add(...txs.flat()),
      [...signers],
      { commitment: "confirmed" }
    );

    console.log("swap_2_signature=", swap2ignature);
    signatures.push(swap2Signature);
  }

  const positionSignature = await web3.sendAndConfirmTransaction(
    raydium.connection,
    positionTransaction,
    [raydium.owner!.signer!, ...positionSigners],
    { commitment: "confirmed" }
  );

  signatures.push(positionSignature);
  console.log("position_signature=", positionSignature);

  return [signatures, extInfo.nftMint.toBase58()] as const;
};
