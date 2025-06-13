import assert from "assert";
import DLMM from "@meteora-ag/dlmm";
import { format } from "@raliqbot/shared";
import { Connection, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT, NATIVE_MINT_2022 } from "@solana/spl-token";

import type { MeteoraClient } from "../api";

export const get_pairs = (...mints: (string | PublicKey)[]) => {
  const pairs = [];
  const addresses = mints.map((mint) =>
    mint instanceof PublicKey ? mint.toBase58() : mint
  );

  for (let idx = 0; idx < addresses.length; idx++) {
    for (let idx0 = 0; idx0 < addresses.length; idx0++) {
      if (idx !== idx0)
        pairs.push(format("%-%", addresses[idx], addresses[idx0]));
    }
  }

  return pairs;
};

export const get_native_mint_pool = async (
  connection: Connection,
  client: MeteoraClient,
  mint: PublicKey
) => {
  const pairMints = [
    NATIVE_MINT.toBase58(),
    NATIVE_MINT_2022.toBase58(),
    mint.toBase58(),
  ];

  const { pairs } = await client.pair.allWithPagination({
    include_pool_token_pairs: get_pairs(...pairMints),
  });

  assert(pairs.length > 0, "no valid pairs found for native mint");

  const [pair] = pairs;
  const nativeToMintPool = await DLMM.create(
    connection,
    new PublicKey(pair.address)
  );

  return nativeToMintPool;
};
