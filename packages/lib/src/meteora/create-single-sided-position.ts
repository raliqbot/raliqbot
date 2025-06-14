import BN from "bn.js";
import DLMM from "@meteora-ag/dlmm";
import type { StrategyType } from "@meteora-ag/dlmm";
import { Connection, PublicKey } from "@solana/web3.js";

import type { MeteoraClient } from "./api";
import { is_native_mint, parse_amount, to_bn } from "../utils";
import { initialize_swap_from_sol } from "./utils/swap-from-sol";

type CreateSingleSidedPositionArgs = {
  slippage: BN;
  owner: PublicKey;
  positionId: PublicKey;
  strategyType: StrategyType;
  mint: DLMM["tokenX"]["mint"];
  input: {
    mint?: string | PublicKey;
    amount: string | bigint | number;
  };
  maxBinId: number;
  minBinId: number;
};

export const create_single_sided_position = async (
  connection: Connection,
  pool: DLMM,
  client: MeteoraClient,
  {
    owner,
    mint,
    input,
    slippage,
    positionId,
    strategyType,
    maxBinId,
    minBinId,
  }: CreateSingleSidedPositionArgs
) => {
  const isNative = is_native_mint(mint.address);

  if (isNative) {
    const swapForY = mint.address.equals(pool.tokenX.mint.address);

    const amount = parse_amount(input.amount, mint.decimals);
    const totalXAmount = swapForY ? new BN(0) : to_bn(amount);
    const totalYAmount = swapForY ? to_bn(amount) : new BN(0);

    return [
      await pool.initializePositionAndAddLiquidityByStrategy({
        totalXAmount,
        totalYAmount,
        user: owner,
        positionPubKey: positionId,
        strategy: {
          maxBinId,
          minBinId,
          strategyType,
        },
      }),
    ];
  } else {
    const { swapQuote, swapForY, transaction } = await initialize_swap_from_sol(
      connection,
      client,
      owner,
      { slippage, mint: mint.address, amount: input.amount }
    );
    const totalXAmount = swapForY ? new BN(0) : swapQuote.minOutAmount;
    const totalYAmount = swapForY ? swapQuote.minOutAmount : new BN(0);

    return [
      transaction,
      await pool.initializePositionAndAddLiquidityByStrategy({
        user: owner,
        positionPubKey: positionId,
        totalXAmount,
        totalYAmount,
        strategy: {
          maxBinId,
          minBinId,
          strategyType,
        },
      }),
    ];
  }
};
