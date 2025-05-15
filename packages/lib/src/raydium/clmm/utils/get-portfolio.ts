import Decimal from "decimal.js";
import { BN, web3 } from "@coral-xyz/anchor";
import {
  ApiV3PoolInfoConcentratedItem,
  ClmmPositionLayout,
  PoolUtils,
  PositionInfoLayout,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import { BitQuery } from "../../../bitquery";
import { getPoolsWithPositions } from "./get-pools-with-positions";

export const getPortfolio = async (
  raydium: Raydium,
  bitquery: BitQuery,
  programId: web3.PublicKey,
  prefetchedPositions?: ClmmPositionLayout[]
) => {
  const poolsWithPositions = await getPoolsWithPositions(
    raydium,
    programId,
    prefetchedPositions
  );

  const poolsWithPositionsWithAmounts = new Map<
    string,
    {
      pool: {
        price: { PriceInUSD: number; Price: number };
        poolInfo: ApiV3PoolInfoConcentratedItem;
      };
      positions: (ReturnType<typeof PositionInfoLayout.decode> & {
        tokenFeesAUSD: number;
        tokenFeesBUSD: number;
        amountA: number;
        amountB: number;
        amountAUSD: number;
        amountBUSD: number;
      })[];
    }
  >();

  for (const { pool, positions } of poolsWithPositions) {
    const { poolInfo } = pool;
    const epochInfo = await raydium.connection.getEpochInfo();
    const {
      data: {
        data: {
          Solana: { DEXTradeByTokens },
        },
      },
    } = await bitquery.price.getPairPrice({
      baseToken: poolInfo.mintA.address,
      quoteToken: poolInfo.mintB.address,
      poolId: poolInfo.id,
    });

    const [
      {
        Trade: { Price, PriceInUSD },
      },
    ] = DEXTradeByTokens;

    console.log("price=", Price, " price_in_usd=", PriceInUSD);

    for (const position of positions) {
      const { amountA: poolAmountA, amountB: poolAmountB } =
        await PoolUtils.getAmountsFromLiquidity({
          poolInfo,
          epochInfo,
          add: true,
          slippage: 0,
          liquidity: position.liquidity,
          tickLower: position.tickLower,
          tickUpper: position.tickUpper,
        });

      const amountA = new Decimal(poolAmountA.amount.toString())
        .div(Math.pow(10, poolInfo.mintA.decimals))
        .toNumber();
      const amountB = new Decimal(poolAmountB.amount.toString())
        .div(Math.pow(10, poolInfo.mintB.decimals))
        .toNumber();

      const amountAUSD = amountA * PriceInUSD;
      const amountBUSD = amountB * (PriceInUSD / Price);
      console.log("poolPrice=", poolInfo.price);
      console.log("amountA=", amountA, "amountB=", amountB);
      console.log("amountAUSD=", amountAUSD, "amountBUSD=", amountBUSD);

      const rewards = position.rewardInfos.reduce(
        (acc, curr) => acc.add(curr.rewardAmountOwed),
        new BN(0)
      );

      console.log("reward total=", rewards.toString());

      const tokenFeesA = new Decimal(position.tokenFeesOwedA.toString())
        .div(Math.pow(10, poolInfo.mintA.decimals))
        .toNumber();
      const tokenFeesB = new Decimal(position.tokenFeesOwedB.toString())
        .div(Math.pow(10, poolInfo.mintB.decimals))
        .toNumber();

      const tokenFeesAUSD = tokenFeesA * PriceInUSD;
      const tokenFeesBUSD = tokenFeesB * (PriceInUSD / Price);

      console.log("tokenFeesA=", tokenFeesA, "tokenFeesB=", tokenFeesB);
      console.log(
        "tokenFeesAUSD=",
        tokenFeesAUSD,
        "tokenFeesBUSD=",
        tokenFeesBUSD
      );

      const positionWithUSDAmounts = {
        amountA,
        amountB,
        amountAUSD,
        amountBUSD,
        tokenFeesAUSD,
        tokenFeesBUSD,
        ...position,
      };

      const poolWithPositionsWithAmounts = poolsWithPositionsWithAmounts.get(
        poolInfo.id
      );

      if (poolWithPositionsWithAmounts)
        poolWithPositionsWithAmounts.positions.push(positionWithUSDAmounts);
      else
        poolsWithPositionsWithAmounts.set(poolInfo.id, {
          pool: { ...pool, price: { Price, PriceInUSD } },
          positions: [positionWithUSDAmounts],
        });
    }
  }

  return Array.from(poolsWithPositionsWithAmounts.values());
};
