import assert from "assert";
import { Decimal } from "decimal.js";
import { BN, web3 } from "@coral-xyz/anchor";
import {
  PoolUtils,
  type ReturnTypeFetchMultiplePoolTickArrays,
  type ApiV3PoolInfoConcentratedItem,
  type ClmmKeys,
  type ComputeClmmPoolInfo,
  type Raydium,
  TickUtils,
  TxVersion,
} from "@raydium-io/raydium-sdk-v2";

import { format } from "../utils";
import { isValidClmm } from "./utils";

export const createPosition = async (
  raydium: Raydium,
  input: { mint: string; amount: number },
  poolId: string,
  [startPrice, endPrice]: [number, number],
  slippage: number
) => {
  let poolKeys: ClmmKeys | undefined;
  let clmmPoolInfo: ComputeClmmPoolInfo | undefined;
  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;
  let tickCache: ReturnTypeFetchMultiplePoolTickArrays | undefined;

  if (raydium.cluster === "mainnet") {
    const poolInfos = await raydium.api.fetchPoolById({ ids: poolId });
    for (const poolInfoItem of poolInfos)
      if (isValidClmm(poolInfoItem.programId)) {
        poolInfo = poolInfoItem as ApiV3PoolInfoConcentratedItem;
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
  } else {
    const pool = await raydium.clmm.getPoolInfoFromRpc(poolId);
    poolInfo = pool.poolInfo;
    poolKeys = pool.poolKeys;
    tickCache = pool.tickData;
    clmmPoolInfo = pool.computePoolInfo;
  }

  assert(
    poolInfo && clmmPoolInfo && tickCache,
    format("target pool=% is not a CLMM pool", poolId)
  );
  assert(
    [poolInfo.mintA.address, poolInfo.mintB.address].includes(input.mint),
    format("input mint=% does not match pool tokens", input.mint)
  );

  const epochInfo = await raydium.fetchEpochInfo();
  const baseIn = input.mint === poolInfo.mintA.address;
  const amountIn = new BN(
    new Decimal(input.amount)
      .div(2)
      .mul(
        Math.pow(10, baseIn ? poolInfo.mintA.decimals : poolInfo.mintB.decimals)
      )
      .toFixed()
  );

  const rpcPoolInfo = await raydium.clmm.getRpcClmmPoolInfo({
    poolId: poolInfo.id,
  });
  poolInfo.price = rpcPoolInfo.currentPrice;

  const { minAmountOut, remainingAccounts } = PoolUtils.computeAmountOutFormat({
    amountIn,
    poolInfo: clmmPoolInfo,
    tickArrayCache: tickCache[poolId],
    tokenOut: poolInfo[baseIn ? "mintB" : "mintA"],
    slippage,
    epochInfo,
  });

  const { transaction: swapTrasaction, signers: swapSigners } =
    await raydium.clmm.swap({
      poolInfo,
      poolKeys,
      inputMint: input.mint,
      amountOutMin: minAmountOut.amount.raw,
      observationId: clmmPoolInfo.observationId,
      amountIn,
      ownerInfo: {
        useSOLBalance: true,
      },
      remainingAccounts,
      checkCreateATAOwner: true,
      txVersion: TxVersion.LEGACY,
    });

  const { tick: lowerTick } = TickUtils.getPriceAndTick({
    poolInfo,
    baseIn: !baseIn,
    price: new Decimal(startPrice),
  });

  const { tick: upperTick } = TickUtils.getPriceAndTick({
    poolInfo,
    baseIn: baseIn,
    price: new Decimal(endPrice),
  });

  const liquidityInfo = await PoolUtils.getLiquidityAmountOutFromAmountIn({
    poolInfo,
    epochInfo,
    add: true,
    slippage: 0,
    inputA: baseIn,
    amount: amountIn,
    amountHasFee: true,
    tickUpper: Math.max(lowerTick, upperTick),
    tickLower: Math.min(lowerTick, upperTick),
  });

  const {
    transaction: positionTransaction,
    extInfo,
    signers,
  } = await raydium.clmm.openPositionFromBase({
    poolInfo,
    poolKeys,
    base: baseIn ? "MintB" : "MintA",
    baseAmount: minAmountOut.amount.raw,
    otherAmountMax: baseIn
      ? liquidityInfo.amountA.amount
      : liquidityInfo.amountB.amount,
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

  const signature = await web3.sendAndConfirmTransaction(
    raydium.connection,
    new web3.Transaction().add(swapTrasaction).add(positionTransaction),
    [raydium.owner!.signer!, ...swapSigners, ...signers]
  );

  return [signature, extInfo.nftMint.toBase58()];
};
