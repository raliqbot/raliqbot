import assert from "assert";
import {
  ApiV3PoolInfoConcentratedItem,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";
import {
  Transaction,
  sendAndConfirmTransaction,
  Connection,
  PublicKey,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";

export const createPoolMintAta = async (
  raydium: Raydium,
  poolInfo: ApiV3PoolInfoConcentratedItem
) => {
  assert(
    raydium.owner && raydium.owner.signer,
    "owner is needed as param in raydium instance"
  );

  const mints = [
    [
      new PublicKey(poolInfo.mintA.address),
      new PublicKey(poolInfo.mintA.programId),
    ],
    [
      new PublicKey(poolInfo.mintB.address),
      new PublicKey(poolInfo.mintB.programId),
    ],
  ] as const;
  const atas = mints.map(([mint, programId]) =>
    getAssociatedTokenAddressSync(mint, raydium.ownerPubKey, false, programId)
  );
  const mintsWithAtas = mints.map(
    (mint, index) => [...mint, atas[index]] as const
  );
  const accountInfos = await raydium.connection.getMultipleAccountsInfo(atas);
  const missingAtas = mintsWithAtas.filter((_, index) => !accountInfos[index]);

  if (missingAtas.length > 0) {
    console.log("[ata.creating] ", missingAtas);
    const transaction = new Transaction().add(
      ...missingAtas.map(([mintAddress, programId, ata]) =>
        createAssociatedTokenAccountIdempotentInstruction(
          raydium.ownerPubKey,
          ata,
          raydium.ownerPubKey,
          mintAddress,
          programId
        )
      )
    );

    return sendAndConfirmTransaction(
      raydium.connection as unknown as Connection,
      transaction,
      [raydium.owner.signer],
      { commitment: "confirmed" }
    );
  }

  return null;
};
