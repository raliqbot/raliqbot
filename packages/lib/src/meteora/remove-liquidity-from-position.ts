import BN from "bn.js";
import DLMM from "@meteora-ag/dlmm";
import type { LbPosition } from "@meteora-ag/dlmm";
import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";

type AddSingleSidedPositionArgs = {
  slippage: BN;
  owner: Keypair;
  percentage: number;
  position: LbPosition;
  mint: DLMM["tokenX"]["mint"];
  input: {
    mint?: string | PublicKey;
    amount: string | bigint | number;
  };
  singleSided: string | PublicKey;
};

export const remove_liquidity_from_position = async (
  connection: Connection,
  pool: DLMM,
  { owner, position, singleSided, percentage }: AddSingleSidedPositionArgs
) => {
  let fromBinId: number, toBinId: number;

  if (singleSided) {
    const sideX = pool.tokenX.mint.address.equals(new PublicKey(singleSided));
    if (sideX) {
      const bins = position.positionData.positionBinData.filter(
        (bin) => BigInt(bin.binXAmount) > 0
      );
      fromBinId = bins[0].binId;
      toBinId = bins[bins.length - 1].binId;
    } else {
      const bins = position.positionData.positionBinData.filter(
        (bin) => BigInt(bin.binYAmount) > 0
      );
      fromBinId = bins[0].binId;
      toBinId = bins[bins.length - 1].binId;
    }
  } else {
    const bins = position.positionData.positionBinData;
    fromBinId = bins[0].binId;
    toBinId = bins[bins.length - 1].binId;
  }

  const transactions = await pool.removeLiquidity({
    toBinId,
    fromBinId,
    user: owner.publicKey,
    position: position.publicKey,
    bps: new BN(percentage * 100),
  });

  const transaction = new Transaction();
  if (Array.isArray(transactions)) transaction.add(...transactions);
  else transaction.add(transaction);

  return {
    transaction,
    execute: (options: ConfirmOptions) =>
      sendAndConfirmTransaction(connection, transaction, [owner], options),
  };
};
