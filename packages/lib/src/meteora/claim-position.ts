import DLMM, { LbPosition } from "@meteora-ag/dlmm";
import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";

export const claim_position = async (
  connection: Connection,
  pool: DLMM,
  owner: Keypair,
  prefetchedPositions?: LbPosition[]
) => {
  const positions = prefetchedPositions
    ? prefetchedPositions
    : await pool
        .getPositionsByUserAndLbPair(owner.publicKey)
        .then(({ userPositions }) => userPositions);

  const transactions = await pool.claimAllRewards({
    owner: owner.publicKey,
    positions,
  });

  const transaction = new Transaction().add(...transactions);

  return {
    positions,
    transaction,
    execute: () => sendAndConfirmTransaction(connection, transaction, [owner]),
  };
};
