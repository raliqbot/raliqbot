import assert from "assert";
import Decimal from "decimal.js";
import { BN, web3 } from "@coral-xyz/anchor";
import {
  ApiV3PoolInfoConcentratedItem,
  ApiV3Token,
  ClmmKeys,
  getPdaPersonalPositionAddress,
  PositionInfoLayout,
  PositionUtils,
  Raydium,
  TickArrayLayout,
  TickUtils,
  U64_IGNORE_RANGE,
} from "@raydium-io/raydium-sdk-v2";

import { getPoolsWithPositions } from "./get-pools-with-positions";

export const getPositions = async (
  raydium: Raydium,
  programId: web3.PublicKey,
  ...positionIds: string[]
) => {
  if (positionIds.length === 0) {
    let tokenAccounts = raydium.account.tokenAccounts;

    if (raydium.account.tokenAccounts.length === 0)
      tokenAccounts = await raydium.account
        .fetchWalletTokenAccounts()
        .then(({ tokenAccounts }) => tokenAccounts);

    positionIds = raydium.account.tokenAccounts.map((tokenAccount) =>
      tokenAccount.mint.toBase58()
    );
  }

  const positionsNftMints = positionIds.map(
    (positionId) =>
      getPdaPersonalPositionAddress(programId, new web3.PublicKey(positionId))
        .publicKey
  );

  const positions = await raydium.connection
    .getMultipleAccountsInfo(positionsNftMints)
    .then((accounts) =>
      accounts
        .filter(Boolean)
        .map((account) => PositionInfoLayout.decode(account!.data))
    );

  const epochInfo = await raydium.fetchEpochInfo();
  const poolsWithPositions = await getPoolsWithPositions(
    raydium,
    programId,
    positions
  );

  const poolsWithPositionsWithAmountAndRewardInfo: Map<
    string,
    {
      pool: {
        poolInfo: ApiV3PoolInfoConcentratedItem;
        poolKeys?: ClmmKeys;
      };
      positions: (Omit<
        ReturnType<typeof PositionInfoLayout.decode>,
        "rewardInfos" | "tokenFeesOwedA" | "tokenFeesOwedB"
      > & {
        amountA: BN;
        amountB: BN;
        priceLower: Decimal;
        priceUpper: Decimal;
        rewardInfos: { mint: ApiV3Token; amount: BN }[];
      })[];
    }
  > = new Map();

  for (const { pool, positions } of poolsWithPositions) {
    const { poolInfo } = pool;

    for (const position of positions) {
      const priceLower = TickUtils.getTickPrice({
        poolInfo,
        tick: position.tickLower,
        baseIn: true,
      });

      const priceUpper = TickUtils.getTickPrice({
        poolInfo,
        tick: position.tickUpper,
        baseIn: true,
      });

      const { amountA, amountB } = PositionUtils.getAmountsFromLiquidity({
        poolInfo,
        epochInfo,
        add: false,
        slippage: 0,
        ownerPosition: position,
        liquidity: position.liquidity,
      });

      const tickArrayAddresses = [
        TickUtils.getTickArrayAddressByTick(
          new web3.PublicKey(poolInfo.programId),
          new web3.PublicKey(poolInfo.id),
          position.tickLower,
          poolInfo.config.tickSpacing
        ),
        TickUtils.getTickArrayAddressByTick(
          new web3.PublicKey(poolInfo.programId),
          new web3.PublicKey(poolInfo.id),
          position.tickUpper,
          poolInfo.config.tickSpacing
        ),
      ];

      const tickArrays = await raydium.connection.getMultipleAccountsInfo(
        tickArrayAddresses
      );

      assert(
        tickArrays.every((tickArray) => !!tickArray),
        "tick data not found"
      );

      const [tickArrayLower, tickArrayUpper] = tickArrays.map((tickArray) =>
        TickArrayLayout.decode(tickArray.data)
      );

      const tickLowerState =
        tickArrayLower.ticks[
          TickUtils.getTickOffsetInArray(
            position.tickLower,
            poolInfo.config.tickSpacing
          )
        ];
      const tickUpperState =
        tickArrayUpper.ticks[
          TickUtils.getTickOffsetInArray(
            position.tickUpper,
            poolInfo.config.tickSpacing
          )
        ];

      const rpcPoolData = await raydium.clmm.getRpcClmmPoolInfo({
        poolId: position.poolId,
      });
      const tokenFees = PositionUtils.GetPositionFeesV2(
        rpcPoolData,
        position,
        tickLowerState,
        tickUpperState
      );
      let rewards = PositionUtils.GetPositionRewardsV2(
        rpcPoolData,
        position,
        tickLowerState,
        tickUpperState
      );

      const [tokenFeeAmountA, tokenFeeAmountB] = [
        tokenFees.tokenFeeAmountA.gte(new BN(0)) &&
        tokenFees.tokenFeeAmountA.lt(U64_IGNORE_RANGE)
          ? tokenFees.tokenFeeAmountA
          : new BN(0),
        tokenFees.tokenFeeAmountB.gte(new BN(0)) &&
        tokenFees.tokenFeeAmountB.lt(U64_IGNORE_RANGE)
          ? tokenFees.tokenFeeAmountB
          : new BN(0),
      ];

      rewards = rewards.map((reward) =>
        reward.gte(new BN(0)) && reward.lt(U64_IGNORE_RANGE)
          ? reward
          : new BN(0)
      );

      const rewardInfos = rewards
        .map((reward, index) => {
          const rewardInfo = poolInfo.rewardDefaultInfos.find(
            (rewardInfo) =>
              rewardInfo.mint.address ===
              rpcPoolData.rewardInfos[index].tokenMint.toBase58()
          );
          if (rewardInfo)
            return {
              mint: rewardInfo.mint,
              amount: reward,
            };
        })
        .filter((rewardInfo) => !!rewardInfo);

      const feeARewardIndex = rewardInfos.findIndex(
        (rewardInfo) => rewardInfo.mint.address === poolInfo.mintA.address
      );

      if (rewardInfos[feeARewardIndex])
        rewardInfos[feeARewardIndex].amount =
          rewardInfos[feeARewardIndex].amount.add(tokenFeeAmountA);
      else
        rewardInfos.push({
          mint: poolInfo.mintA,
          amount: tokenFeeAmountA,
        });

      const feeBRewardIndex = rewardInfos.findIndex(
        (rewardInfo) => rewardInfo.mint.address === poolInfo.mintB.address
      );

      if (rewardInfos[feeBRewardIndex])
        rewardInfos[feeBRewardIndex].amount =
          rewardInfos[feeBRewardIndex].amount.add(tokenFeeAmountB);
      else rewardInfos.push({ mint: poolInfo.mintB, amount: tokenFeeAmountB });

      const poolWithPositionsWithAmountAndRewardInfo =
        poolsWithPositionsWithAmountAndRewardInfo.get(poolInfo.id);
      const data = {
        ...position,
        rewardInfos,
        amountA: amountA.amount,
        amountB: amountB.amount,
        priceLower: priceLower.price,
        priceUpper: priceUpper.price,
      };

      if (poolWithPositionsWithAmountAndRewardInfo)
        poolWithPositionsWithAmountAndRewardInfo.positions.push(data);
      else
        poolsWithPositionsWithAmountAndRewardInfo.set(poolInfo.id, {
          pool,
          positions: [data],
        });
    }
  }

  return Array.from(poolsWithPositionsWithAmountAndRewardInfo.values());
};
