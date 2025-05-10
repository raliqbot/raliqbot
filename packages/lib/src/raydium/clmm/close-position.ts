import { chunk } from "lodash";
import { BN, web3 } from "@coral-xyz/anchor";
import {
  PositionInfoLayout,
  TxVersion,
  type Raydium,
} from "@raydium-io/raydium-sdk-v2";

import { getPoolsWithPositions } from "./utils";

export const closePosition = async (
  raydium: Raydium,
  programId: web3.PublicKey,
  prefetchedPositions?: ReturnType<typeof PositionInfoLayout.decode>[]
) => {
  const transactions = [];
  const txSigners: web3.Signer[][] = [];

  const poolsWithPositions = await getPoolsWithPositions(
    raydium,
    programId,
    prefetchedPositions
  );

  console.log(
    "[position.close.initializing] ",
    poolsWithPositions.map(({ positions }) =>
      positions.map((position) => position.nftMint.toBase58())
    )
  );

  for (const {
    pool: { poolInfo, poolKeys },
    positions,
  } of poolsWithPositions) {
    for (const position of positions) {
      const { transaction, signers } = await raydium.clmm.decreaseLiquidity({
        poolInfo,
        poolKeys,
        amountMinA: new BN(0),
        amountMinB: new BN(0),
        ownerPosition: position,
        liquidity: position.liquidity,
        txVersion: TxVersion.LEGACY,
        ownerInfo: {
          closePosition: true,
          useSOLBalance: true,
        },
      });

      txSigners.push(signers);
      transactions.push(transaction);
    }
  }

  if (transactions.length > 0) {
    console.log(
      "[position.close.processing] transactions.length=",
      transactions.length
    );

    const chunkedTxs = chunk(transactions, 5);
    const signatures = await Promise.all(
      chunkedTxs.map((transaction) =>
        web3.sendAndConfirmTransaction(
          raydium.connection,
          new web3.Transaction().add(...transaction),
          txSigners.flat(),
          { commitment: "confirmed" }
        )
      )
    );
    console.log("[position.close.processing] signature=", signatures);

    return signatures;
  }

  return null;
};
