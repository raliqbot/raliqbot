import moment from "moment";
import { web3 } from "@coral-xyz/anchor";
import { and, eq, lte } from "drizzle-orm";
import { getPoolInfo } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID, Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../core";
import type { Database } from "../db";
import { positions } from "../db/schema";
import { loadWallet } from "../controllers/wallets.controller";

export const reposition = async (db: Database, connection: web3.Connection) => {
  const now = moment();
  const users = await db.query.users
    .findMany({
      with: {
        settings: true,
        wallets: true,
      },
    })
    .execute();

  for (const user of users) {
    const nextRepositionTime = moment(user.repositionExecutionTime).add(
      user.settings!.rebalanceSchedule,
      "minutes"
    );

    const canReposition = now.isAfter(nextRepositionTime);

    if (canReposition) {
      const [dbWallet] = user.wallets;

      const dbPositions = await db.query.positions.findMany({
        where: and(
          eq(positions.enabled, true),
          eq(positions.algorithm, "spot"),
          lte(positions.updatedAt, nextRepositionTime.toDate()),
          eq(positions.wallet, dbWallet.id)
        ),
      });

      const wallet = loadWallet(dbWallet);
      const raydium = await Raydium.load({
        owner: wallet,
        cluster: "mainnet",
        connection: new web3.Connection(getEnv("RPC_URL")),
      });

      const poolsAndPositions = new Map<string, typeof dbPositions>();

      for (const position of dbPositions) {
        const poolAndPosition = poolsAndPositions.get(position.pool);
        if (poolAndPosition) poolAndPosition.push(position);
        else poolsAndPositions.set(position.pool, [position]);
      }

      const cachedOnchainPositions = await raydium.clmm.getOwnerPositionInfo({
        programId: CLMM_PROGRAM_ID,
      });

      for (const [pool, positions] of poolsAndPositions.entries()) {
        const { poolInfo, poolKeys } = await getPoolInfo(raydium, pool);
        const onChainPositions = cachedOnchainPositions.filter(
          (onChainPosition) =>
            positions.find(
              (position) => position.id === onChainPosition.nftMint.toBase58()
            )
        );

        /// Check if should reposition
      }
    }
  }
};
