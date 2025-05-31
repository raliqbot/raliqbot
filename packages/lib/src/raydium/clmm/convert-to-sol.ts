import { web3 } from "@coral-xyz/anchor";
import { format } from "@raliqbot/shared";
import { NATIVE_MINT } from "@solana/spl-token";
import { Raydium, SOLMint } from "@raydium-io/raydium-sdk-v2";

import { getPoolByMints } from "./utils";
import { createSwap } from "./create-swap";
import { parseRewardSignatures } from "./utils/parse-reward-signature";

export async function convertTokenBalanceChangesToSOL(raydium: Raydium, slippage: number, ...signatures: string[]) {
  const tokenBalanceChanges = await parseRewardSignatures(
    raydium,
    ...signatures
  );
  const mintToBalanceChange: Record<string, bigint> = {};

  for (const tokenBalanceChange of tokenBalanceChanges) {
    for (const [mint, balance] of Object.entries(tokenBalanceChange)) {
      if (mintToBalanceChange[mint])
        mintToBalanceChange[mint] += BigInt(balance);
      else mintToBalanceChange[mint] = BigInt(balance);
    }
  }

  const epochInfo = await raydium.fetchEpochInfo();

  let swaps = await Promise.all(
    Object.entries(mintToBalanceChange).map(async ([mint, balance]) => {
      if (
        balance > BigInt(1) &&
        !new web3.PublicKey(mint).equals(NATIVE_MINT)
      ) {
        const { poolInfo, poolKeys, tickCache, clmmPoolInfo } =
          await getPoolByMints(raydium, [NATIVE_MINT, mint], true);

        console.log(
          format(
            "[convert.mint.toSOL.initialized] mint=% poolId=% balance=%",
            mint,
            poolInfo.id,
            balance.toLocaleString()
          )
        );
        return await createSwap(raydium, {
          epochInfo,
          slippage,
          poolInfo,
          poolKeys,
          tickCache,
          clmmPoolInfo,
          input: { amount: balance, mint },
          outputMint: SOLMint.toBase58(),
        });
      }
    })
  );

  const validSwaps = swaps.filter((swap) => !!swap);

  console.log("[convert.mint.toSOL] valid_swaps=", validSwaps.length);

  return Promise.all(
    validSwaps.map(([, { transaction, signers }]) => {
      return web3.sendAndConfirmTransaction(
        raydium.connection,
        transaction,
        signers,
        { commitment: "confirmed" }
      );
    })
  );
}
