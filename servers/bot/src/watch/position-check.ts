import { sleep } from "bun";
import { eq } from "drizzle-orm";
import Decimal from "decimal.js";
import type { Telegraf } from "telegraf";
import { web3 } from "@coral-xyz/anchor";
import { format } from "@raliqbot/shared";
import { reposition } from "@raliqbot/lib";
import {
  type DexScreener,
  getPortfolio,
  type getPositions,
} from "@raliqbot/lib";
import {
  CLMM_PROGRAM_ID,
  Raydium,
  TickUtils,
} from "@raydium-io/raydium-sdk-v2";

import type { Database } from "../db";
import { positionAlert } from "./position-alert";
import { positions as _positions } from "../db/schema";
import { loadWallet } from "../controllers/wallets.controller";

export const positionChecks = async (
  db: Database,
  bot: Telegraf,
  dexscreener: DexScreener,
  connection: web3.Connection
) => {
  const wallets = await db.query.wallets
    .findMany({
      with: {
        user: {
          with: { settings: { columns: { slippage: true } } },
          columns: { id: true },
        },
      },
      columns: { id: true, key: true },
    })
    .execute();

  console.log("[position.checks.execute] wallets=", wallets.length);

  if (wallets.length > 0) {
    let raydium = await Raydium.load({ connection });

    for (const dbWallet of wallets) {
      const wallet = loadWallet(dbWallet);
      raydium = raydium.setOwner(wallet);

      const poolsWithPositions = await getPortfolio(
        raydium,
        dexscreener,
        CLMM_PROGRAM_ID
      );

      const inactivePoolsWithPositions: Record<
        string,
        Awaited<ReturnType<typeof getPositions>>[number]
      > = {};

      for (const {
        pool: { poolInfo },
        positions,
      } of poolsWithPositions) {
        if (positions.length > 0)
          console.log(
            "[user.wallet.pool.positions] ",
            format(
              "wallet=% poolId=% positions=%",
              dbWallet.id,
              poolInfo.id,
              positions.length
            )
          );

        for (const position of positions) {
          const { tick } = TickUtils.getPriceAndTick({
            poolInfo,
            price: new Decimal(poolInfo.price),
            baseIn: true,
          });
          const active =
            tick >= position.tickLower || tick <= position.tickUpper;

          const cachedPosition = await db.query.positions
            .findFirst({
              where: eq(_positions.id, position.nftMint),
            })
            .execute();

          const tasks = [];

          if (
            (cachedPosition && cachedPosition.enabled !== active) ||
            !cachedPosition
          )
            tasks.push(
              positionAlert(db, bot, poolInfo, position, active, dbWallet)
            );

          if (!active) {
            if (!inactivePoolsWithPositions[poolInfo.id])
              inactivePoolsWithPositions[poolInfo.id] = {
                pool: { poolInfo },
                positions: [],
              };
            inactivePoolsWithPositions[poolInfo.id].positions.push(
              position.default
            );
          }

          await Promise.all(tasks);
        }
      }

      const _inactivePoolsWithPositions = Object.values(
        inactivePoolsWithPositions
      );

      if (_inactivePoolsWithPositions.length > 0)
        await reposition(
          raydium,
          parseFloat(
            dbWallet.user.settings ? dbWallet.user.settings.slippage : "0.01"
          ),
          ..._inactivePoolsWithPositions
        );

      await sleep(2000);
    }
  }
};
