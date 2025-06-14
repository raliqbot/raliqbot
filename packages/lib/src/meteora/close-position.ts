import assert from "assert";
import { format } from "@raliqbot/shared";
import DLMM, { LbPosition } from "@meteora-ag/dlmm";
import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { BN } from "bn.js";

export const close_position = async (
  connection: Connection,
  pool: DLMM,
  owner: Keypair,
  prefetchedPositions?: LbPosition[]
) => {
  const positions = prefetchedPositions
    ? prefetchedPositions
    : await pool
        .getPositionsByUserAndLbPair(owner.publicKey)
        .then((positions) =>
          positions.userPositions.map((position) => position)
        );

  assert(
    positions.length > 0,
    format("no positions found for pool=%", pool.pubkey.toBase58())
  );

  const transactions: Transaction[] = [];

  for (const position of positions) {
    const binIds = position.positionData.positionBinData.map(
      (bin) => bin.binId
    );

    const transaction = await pool.removeLiquidity({
      user: owner.publicKey,
      fromBinId: binIds[0],
      shouldClaimAndClose: true,
      position: position.publicKey,
      bps: new Array(binIds.length)
        .fill(new BN(100).muln(100))
        .reduce((a, b) => a.add(b), new BN(0)),
      toBinId: binIds[binIds.length - 1],
    });
    if (Array.isArray(transaction)) transactions.push(...transaction);
    else transactions.push(transaction);
  }

  const transaction = new Transaction().add(...transactions);

  return {
    positions,
    transaction,
    execute: () => sendAndConfirmTransaction(connection, transaction, [owner]),
  };
};
