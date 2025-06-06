import assert from "assert";
import Decimal from "decimal.js";
import { format } from "@raliqbot/shared";
import { BN, web3 } from "@coral-xyz/anchor";
import {
  ApiV3PoolInfoConcentratedItem,
  ClmmKeys,
  PoolUtils,
  Raydium,
  TxVersion,
} from "@raydium-io/raydium-sdk-v2";

import { getPoolById, isValidClmm } from "./utils";

export const increatePositionLiquidity = async (
  raydium: Raydium,
  position: Awaited<
    ReturnType<typeof raydium.clmm.getOwnerPositionInfo>
  >[number],
  input: { mint: string; amount: number },
  slippage: number
) => {
  const { poolInfo, poolKeys } = await getPoolById(raydium, position.poolId);

  const baseIn = poolInfo.mintA.address === input.mint;
  const amount = new BN(
    new Decimal(input.amount)
      .mul(
        Math.pow(10, baseIn ? poolInfo.mintA.decimals : poolInfo.mintB.decimals)
      )
      .toFixed(0)
  );

  const epochInfo = await raydium.fetchEpochInfo();
  const liquidityInfo = await PoolUtils.getLiquidityAmountOutFromAmountIn({
    amount,
    poolInfo,
    epochInfo,
    add: true,
    slippage: 0,
    inputA: baseIn,
    amountHasFee: true,
    tickUpper: Math.max(position.tickLower, position.tickUpper),
    tickLower: Math.min(position.tickLower, position.tickUpper),
  });

  const { transaction: positionTransaction, signers } =
    await raydium.clmm.increasePositionFromLiquidity({
      poolInfo,
      poolKeys,
      ownerPosition: position,
      liquidity: new BN(
        new Decimal(liquidityInfo.liquidity.toString())
          .mul(1 - slippage)
          .toFixed(0)
      ),
      amountMaxA: liquidityInfo.amountSlippageA.amount,
      amountMaxB: new BN(
        new Decimal(liquidityInfo.amountSlippageB.amount.toString())
          .mul(1 + slippage)
          .toFixed(0)
      ),
      checkCreateATAOwner: true,
      ownerInfo: {
        useSOLBalance: true,
      },
      txVersion: TxVersion.LEGACY,
    });

  const signature = await web3.sendAndConfirmTransaction(
    raydium.connection,
    new web3.Transaction().add(positionTransaction),
    [raydium.owner!.signer!, ...signers]
  );

  return signature;
};
