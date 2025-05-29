import { sleep } from "bun";
import { eq } from "drizzle-orm";
import Decimal from "decimal.js";
import { Telegraf } from "telegraf";
import { web3 } from "@coral-xyz/anchor";
import { format } from "@raliqbot/shared";
import { DexScreener, getPortfolio } from "@raliqbot/lib";
import {
  CLMM_PROGRAM_ID,
  Raydium,
  TickUtils,
} from "@raydium-io/raydium-sdk-v2";

import { Database } from "../db";
import { positionAlert } from "./position-alert";
import { positions as _positions } from "../db/schema";
import { loadWallet } from "../controllers/wallets.controller";

export const positionChecks = async (
  db: Database,
  bot: Telegraf,
  dexscreemer: DexScreener,
  connection: web3.Connection
) => {
  const wallets = await db.query.wallets
    .findMany({
      with: { user: { columns: { id: true } } },
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
        dexscreemer,
        CLMM_PROGRAM_ID
      );

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

          await Promise.all(tasks);
        }
      }

      await sleep(2000);
    }
  }
};
