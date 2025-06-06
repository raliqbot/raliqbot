import assert from "assert";
import Decimal from "decimal.js";
import { BN, web3 } from "@coral-xyz/anchor";
import type {
  ApiV3PoolInfoConcentratedItem,
  ApiV3Token,
  PositionInfoLayout,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import { getPositions } from "./get-positions";
import type { DexScreener } from "../../../dexscreener";

function isAlmostEqual(
  a: number | string,
  b: number | string,
  epsilon = 1
): boolean {
  const numA = typeof a === "string" ? parseFloat(a) : a;
  const numB = typeof b === "string" ? parseFloat(b) : b;
  return Math.abs(numA - numB) <= epsilon;
}

export const getPortfolio = async (
  raydium: Raydium,
  dexscreener: DexScreener,
  programId: web3.PublicKey,
  prefetchedPositions?: Awaited<ReturnType<typeof getPositions>>
) => {
  const poolsWithPositions = prefetchedPositions
    ? prefetchedPositions
    : await getPositions(raydium, programId);

  const poolsWithPositionsWithAmounts = new Map<
    string,
    {
      pool: {
        price: { PriceInUSD: number; Price: number };
        poolInfo: ApiV3PoolInfoConcentratedItem;
      };
      positions: {
        liquidity: BN;
        tickLower: number;
        tickUpper: number;
        poolId: string;
        nftMint: string;
        rewardToken: {
          reward: number;
          rewardInUSD: number;
          mint: ApiV3Token;
        };
        tokenA: {
          amount: number;
          amountInUSD: number;
          reward: number;
          rewardInUSD: number;
          mint: ApiV3Token;
        };
        tokenB: {
          amount: number;
          amountInUSD: number;
          reward: number;
          rewardInUSD: number;
          mint: ApiV3Token;
        };
        default: Awaited<
          ReturnType<typeof getPositions>
        >[number]["positions"][number];
      }[];
    }
  >();

  for (const { pool, positions } of poolsWithPositions) {
    const { poolInfo } = pool;
    let rewardMint = pool.poolInfo.rewardDefaultInfos.find(
      (info) =>
        info.mint.address !== pool.poolInfo.mintA.address &&
        info.mint.address !== pool.poolInfo.mintB.address
    );

    if (!rewardMint) [rewardMint] = pool.poolInfo.rewardDefaultInfos;

    const data = await Promise.all([
      dexscreener.pair.getPair("solana", poolInfo.id).then(({ data }) => data),
      dexscreener.token
        .getPairsByTokenAddresses("solana", rewardMint.mint.address)
        .then(({ data }) => data),
    ]);

    const [
      {
        pairs: [pair],
      },

      [rewardPair],
    ] = data;

    const { priceUsd, priceNative } = pair;
    const { priceUsd: rewardPriceUsd } = rewardPair;

    const Price = Number(priceNative);
    const PriceInUSD = Number(priceUsd);
    const RewardPriceInUSD = Number(rewardPriceUsd);

    for (const position of positions) {
      const tokenAAmount = new Decimal(position.amountA.toString())
        .div(Math.pow(10, poolInfo.mintA.decimals))
        .toNumber();
      const tokenBAmount = new Decimal(position.amountB.toString())
        .div(Math.pow(10, poolInfo.mintB.decimals))
        .toNumber();

      const stableCoin = isAlmostEqual(priceNative, priceUsd);

      const tokenAAmountUSD = stableCoin
        ? tokenAAmount * PriceInUSD
        : tokenAAmount * (PriceInUSD / Price);
      const tokenBAmountUSD = stableCoin
        ? tokenBAmount * (PriceInUSD / Price)
        : tokenBAmount * PriceInUSD;

      const feeReward = position.detailedRewardInfos.find(
        (rewardInfo) =>
          rewardInfo.mint.address !== poolInfo.mintB.address &&
          rewardInfo.mint.address !== poolInfo.mintB.address
      );
      const feeAReward = position.detailedRewardInfos.find(
        (rewardInfo) => rewardInfo.mint.address === poolInfo.mintA.address
      );
      const feeBReward = position.detailedRewardInfos.find(
        (rewardInfo) => rewardInfo.mint.address === poolInfo.mintB.address
      );

      assert(feeAReward && feeBReward && feeReward, "");

      const tokenReward = new Decimal(feeReward.amount.toString())
        .div(Math.pow(10, feeReward.mint.decimals))
        .toNumber();

      const tokenAReward = new Decimal(feeAReward.amount.toString())
        .div(Math.pow(10, feeAReward.mint.decimals))
        .toNumber();
      const tokenBReward = new Decimal(feeBReward.amount.toString())
        .div(Math.pow(10, feeBReward.mint.decimals))
        .toNumber();

      const tokenARewardUSD = stableCoin
        ? tokenAReward * PriceInUSD
        : tokenAReward * (PriceInUSD / Price);
      const tokenBRewardUSD = stableCoin
        ? tokenBReward * (PriceInUSD / Price)
        : tokenBReward * PriceInUSD;
      const tokenRewardUSD = tokenReward * RewardPriceInUSD;

      const positionWithUSDAmounts = {
        liquidity: position.liquidity,
        poolId: position.poolId.toBase58(),
        nftMint: position.nftMint.toBase58(),
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        rewardToken: {
          reward: tokenReward,
          rewardInUSD: tokenRewardUSD,
          mint: feeReward.mint,
        },
        tokenA: {
          amount: tokenAAmount,
          reward: tokenAReward,
          rewardInUSD: tokenARewardUSD,
          amountInUSD: tokenAAmountUSD,
          mint: feeAReward.mint,
        },
        tokenB: {
          amount: tokenBAmount,
          reward: tokenBReward,
          rewardInUSD: tokenBRewardUSD,
          amountInUSD: tokenBAmountUSD,
          mint: feeBReward.mint,
        },
        default: position,
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
