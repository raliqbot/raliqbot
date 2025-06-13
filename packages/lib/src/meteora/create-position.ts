import BN from "bn.js";
import assert from "assert";
import DLMM, { type StrategyType } from "@meteora-ag/dlmm";
import {
  type Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";

import type { Ratio } from "../ratio";
import type { MeteoraClient } from "./api";
import { initialize_swap_in_sol } from "./utils/swap-in-sol";
import { create_single_sided_position } from "./create-single-sided-position";
import {
  is_native_mint,
  parse_amount,
  parse_amount_decimal,
  to_bn,
} from "../utils";

type CreatePositionArgs = {
  ratio?: Ratio;
  slippage: number;
  poolId: string | PublicKey;
  input: {
    mint: string | PublicKey;
    amount: string | bigint | number;
  };
  strategyType: StrategyType;
  singleSided?: string | PublicKey;
};

export const createPosition = async (
  connection: Connection,
  client: MeteoraClient,
  owner: Keypair,
  args: CreatePositionArgs
) => {
  const position = new Keypair();
  const slippage = new BN(args.slippage);
  const poolId = new PublicKey(args.poolId);
  const isNativeInput = is_native_mint(args.input.mint);

  // only native mint supported now
  assert(isNativeInput, "non native mint input not supported as input mint.");

  const pool = await DLMM.create(connection, poolId);
  const activeBin = await pool.getActiveBin();

  const transactions: Transaction[] = [];

  if (args.singleSided) {
    const singleSided = new PublicKey(args.singleSided);
    assert(
      [pool.tokenX.mint.address, pool.tokenY.mint.address].some((mint) =>
        mint.equals(singleSided)
      ),
      "at least one of the pair must be equal to selected pair address in one sided position."
    );

    if (isNativeInput) {
      if (pool.tokenX.mint.address.equals(singleSided))
        transactions.push(
          ...(await create_single_sided_position(connection, pool, client, {
            ...args,
            slippage,
            maxBinId: 0,
            minBinId: 0,
            mint: pool.tokenX.mint,
            owner: owner.publicKey,
            positionId: position.publicKey,
          }))
        );
      else
        transactions.push(
          ...(await create_single_sided_position(connection, pool, client, {
            ...args,
            slippage,
            maxBinId: 0,
            minBinId: 0,
            mint: pool.tokenY.mint,
            owner: owner.publicKey,
            positionId: position.publicKey,
          }))
        );
    }
  } else {
    assert(args.ratio, "ratio required for non single sided position.");

    if (isNativeInput) {
      let totalXAmount, totalYAmount;

      if (is_native_mint(pool.tokenX.mint.address)) {
        totalXAmount = to_bn(
          parse_amount(args.input.amount, pool.tokenX.mint.decimals)
        )
          .muln(args.ratio.a)
          .divn(100);
      } else {
        const amount = BigInt(
          parse_amount_decimal(args.input.amount, pool.tokenX.mint.decimals)
            .mul(args.ratio.a)
            .div(100)
            .toFixed(0)
        );
        const { swapQuote, transaction } = await initialize_swap_in_sol(
          connection,
          client,
          owner.publicKey,
          { slippage, mint: pool.tokenX.mint.address, amount }
        );
        totalXAmount = swapQuote.minOutAmount;
        transactions.push(transaction);
      }

      if (is_native_mint(pool.tokenY.mint.address)) {
        totalYAmount = to_bn(
          parse_amount(args.input.amount, pool.tokenY.mint.decimals)
        )
          .muln(args.ratio.b)
          .divn(100);
      } else {
        const amount = BigInt(
          parse_amount_decimal(args.input.amount, pool.tokenY.mint.decimals)
            .mul(args.ratio.b)
            .div(100)
            .toFixed(0)
        );
        const { swapQuote, transaction } = await initialize_swap_in_sol(
          connection,
          client,
          owner.publicKey,
          { slippage, mint: pool.tokenY.mint.address, amount }
        );
        totalYAmount = swapQuote.minOutAmount;
        transactions.push(transaction);
      }

      transactions.push(
        await pool.initializePositionAndAddLiquidityByStrategy({
          totalXAmount,
          totalYAmount,
          user: owner.publicKey,
          positionPubKey: position.publicKey,
          strategy: {
            maxBinId: 0,
            minBinId: 0,
            strategyType: args.strategyType,
          },
        })
      );
    }
  }

  return {
    position,
    execute: () =>
      sendAndConfirmTransaction(
        connection,
        new Transaction().add(...transactions),
        [owner, position]
      ),
  };
};
