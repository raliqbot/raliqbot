import { web3 } from "@coral-xyz/anchor";
import {
  ApiV3PoolInfoConcentratedItem,
  PositionInfoLayout,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import { getPoolById } from "./get-pool-by-id";

export const getPoolWithPositionsByWallets = async (
  connection: web3.Connection,
  programId: web3.PublicKey,
  ...wallets: web3.Keypair[]
) => {
  const caches = new Map<
    string,
    {
      pool: { poolInfo: ApiV3PoolInfoConcentratedItem };
      walletAndPositions: Map<
        string,
        {
          wallet: web3.Keypair;
          positions: ReturnType<typeof PositionInfoLayout.decode>[];
        }
      >;
    }
  >();

  for (const wallet of wallets) {
    const raydium = await Raydium.load({ connection });
    const positions = await raydium.clmm.getOwnerPositionInfo({ programId });
    for (const position of positions) {
      const cache = caches.get(position.poolId.toBase58());
      if (cache) {
        const innerCache = cache.walletAndPositions.get(
          wallet.publicKey.toBase58()
        );
        if (innerCache) innerCache.positions.push(position);
      } else {
        const pool = await getPoolById(raydium, position.poolId);
        caches.set(position.poolId.toBase58(), {
          pool,
          walletAndPositions: new Map([
            [wallet.publicKey.toBase58(), { wallet, positions: [position] }],
          ]),
        });
      }
    }
  }

  return Array.from(caches.values()).map((cache) => ({
    pool: cache.pool,
    walletAndPositions: Array.from(cache.walletAndPositions.values()),
  }));
};
