import { chunk } from "lodash";
import { BN, web3 } from "@coral-xyz/anchor";
import { TxVersion, type Raydium } from "@raydium-io/raydium-sdk-v2";

import { getPositions } from "./utils";

export const closePosition = async (
  raydium: Raydium,
  poolsWithPositions: Awaited<ReturnType<typeof getPositions>>
) => {
  const txSigners: web3.Signer[] = [];
  const transactions: web3.Transaction[] = [];

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

      txSigners.push(...signers);
      transactions.push(transaction);
    }
  }

  if (transactions.length > 0) {
    console.log(
      "[position.close.processing] transactions.length=",
      transactions.length
    );

    const chunkedTxs = chunk(transactions, 2);
    const signatures = await Promise.all(
      chunkedTxs.map((transaction) => {
        return web3.sendAndConfirmTransaction(
          raydium.connection,
          new web3.Transaction().add(...transaction),
          txSigners,
          { commitment: "confirmed" }
        );
      })
    );

    return signatures;
  }

  return null;
};
