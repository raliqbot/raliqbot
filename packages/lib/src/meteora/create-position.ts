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
import { toUniqueTx } from "./utils/unique-tx";
import { initialize_swap_from_sol } from "./utils/swap-from-sol";
import { create_single_sided_position } from "./create-single-sided-position";
import {
  is_native_mint,
  parse_amount,
  parse_amount_decimal,
  to_bn,
} from "../utils";

type CreatePositionArgs = {
  pool: DLMM;
  ratio?: Ratio;
  owner: Keypair;
  slippage: number;
  client: MeteoraClient;
  connection: Connection;
  input: {
    mint: string | PublicKey;
    amount: string | bigint | number;
  };
  strategyType: StrategyType;
  rangeIntervals: [number, number];
  singleSided?: string | PublicKey;
};

export const create_position = async ({
  pool,
  owner,
  client,
  connection,
  rangeIntervals,
  ...args
}: CreatePositionArgs) => {
  const position = new Keypair();
  const slippage = new BN(args.slippage);
  const isNativeInput = is_native_mint(args.input.mint);

  assert(isNativeInput, "non native mint input not supported as input mint.");

  const activeBin = await pool.getActiveBin();
  const [minRange, maxRange] = rangeIntervals;

  const minBinId = activeBin.binId - minRange;
  const maxBinId = activeBin.binId + maxRange;

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
            maxBinId,
            minBinId,
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
            maxBinId,
            minBinId,
            mint: pool.tokenY.mint,
            owner: owner.publicKey,
            positionId: position.publicKey,
          }))
        );
    }
  } else {
    console.log("not single sideded");
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
        console.log("not native x");

        const amount = BigInt(
          parse_amount_decimal(args.input.amount, pool.tokenX.mint.decimals)
            .mul(args.ratio.a)
            .div(100)
            .toFixed(0)
        );
        const { swapQuote, transaction } = await initialize_swap_from_sol(
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

        const { swapQuote, transaction } = await initialize_swap_from_sol(
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
            maxBinId,
            minBinId,
            strategyType: args.strategyType,
          },
        })
      );
    }
  }

  const blockHash = await connection.getLatestBlockhash();

  const transaction = toUniqueTx(131285, ...transactions);
  transaction.feePayer = owner.publicKey;
  transaction.recentBlockhash = blockHash.blockhash;

  return {
    position,
    transaction,
    execute: () =>
      sendAndConfirmTransaction(connection, transaction, [owner, position]),
  };
};
