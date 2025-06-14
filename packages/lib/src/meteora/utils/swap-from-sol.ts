import BN from "bn.js";
import { Connection, PublicKey } from "@solana/web3.js";

import type { MeteoraClient } from "../api";
import { get_native_mint_pool } from "./get-pairs";
import { to_bn, parse_amount } from "../../utils";

export const initialize_swap_from_sol = async (
  connection: Connection,
  client: MeteoraClient,
  owner: PublicKey,
  {
    slippage,
    ...args
  }: {
    slippage: BN;
    mint: string | PublicKey;
    amount: number | string | bigint;
  }
) => {
  const mint = new PublicKey(args.mint);
  const nativeToMintPool = await get_native_mint_pool(connection, client, mint);
  const nativeMint = mint.equals(nativeToMintPool.tokenX.mint.address)
    ? nativeToMintPool.tokenY.mint
    : nativeToMintPool.tokenX.mint;
  const swapForYtoX = mint.equals(nativeToMintPool.tokenY.mint.address);
  const amount = to_bn(parse_amount(args.amount, nativeMint.decimals));
  const binArrays = await nativeToMintPool.getBinArrayForSwap(swapForYtoX);

  const swapQuote = nativeToMintPool.swapQuote(
    amount,
    swapForYtoX,
    slippage,
    binArrays
  );

  const transaction = await nativeToMintPool.swap({
    user: owner,
    outToken: mint,
    inAmount: amount,
    inToken: nativeMint.address,
    lbPair: nativeToMintPool.pubkey,
    minOutAmount: swapQuote.minOutAmount,
    binArraysPubkey: swapQuote.binArraysPubkey,
  });

  return { swapQuote, transaction, swapForYtoX };
};
