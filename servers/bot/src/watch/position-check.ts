import { sleep } from "bun";
import { eq } from "drizzle-orm";
import Decimal from "decimal.js";
import { web3 } from "@coral-xyz/anchor";
import { Input, Markup, Telegraf } from "telegraf";
import { format } from "@raliqbot/shared";
import { DexScreener, getPortfolio } from "@raliqbot/lib";
import {
  CLMM_PROGRAM_ID,
  Raydium,
  TickUtils,
} from "@raydium-io/raydium-sdk-v2";

import { Database } from "../db";
import { buildMediaURL } from "../core";
import { positions as _positions } from "../db/schema";
import { readFileSync, cleanText } from "../bot/utils";
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

  for (const dbWallet of wallets) {
    const wallet = loadWallet(dbWallet);
    const raydium = await Raydium.load({ connection, owner: wallet });
    const poolsWithPositions = await getPortfolio(
      raydium,
      dexscreemer,
      CLMM_PROGRAM_ID
    );
    console.log(
      "[user.wallet.pool.positions] ",
      format(
        "wallet=% poolId=% positions=%",
        dbWallet.id,
        poolsWithPositions.filter(
          (poolWithPositions) => poolWithPositions.positions.length > 0
        ).length
      )
    );

    for (const {
      pool: { poolInfo },
      positions,
    } of poolsWithPositions) {
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
        const { tick: currentTick } = TickUtils.getPriceAndTick({
          poolInfo,
          price: new Decimal(poolInfo.price),
          baseIn: true,
        });

        const active =
          currentTick >= position.tickLower ||
          currentTick <= position.tickUpper;
        const positionId = position.nftMint;
        const name = format(
          "%/%",
          poolInfo.mintA.symbol,
          poolInfo.mintB.symbol
        );
        const algorithm =
          position.tickLower !== 0 && position.tickUpper !== 0
            ? "spot"
            : "single-sided";

        if (active) {
          const dbPosition = await db.query.positions
            .findFirst({
              where: eq(_positions.id, positionId),
            })
            .execute();

          if (dbPosition && dbPosition.enabled === active) continue;

          await db
            .insert(_positions)
            .values({
              id: position.nftMint,
              pool: poolInfo.id,
              wallet: dbWallet.id,
              enabled: active,
              algorithm,
              metadata: {
                amountA: 0,
                amountB: 0,
                lowerTick: position.tickLower,
                upperTick: position.tickUpper,
                stopLossPercentage: 0.75,
              },
            })
            .onConflictDoUpdate({
              target: [_positions.id],
              set: { enabled: active },
            });

          await bot.telegram.sendPhoto(
            dbWallet.user.id,
            Input.fromURLStream(
              buildMediaURL("prefetched/position", {
                data: JSON.stringify({
                  mintA: {
                    name: poolInfo.mintA.name,
                    symbol: poolInfo.mintA.symbol,
                    logoURI: poolInfo.mintA.logoURI,
                    address: poolInfo.mintA.address,
                  },
                  mintB: {
                    name: poolInfo.mintB.name,
                    symbol: poolInfo.mintB.symbol,
                    logoURI: poolInfo.mintB.logoURI,
                    address: poolInfo.mintB.address,
                  },
                  tvl: poolInfo.tvl,
                  feeRate: poolInfo.feeRate,
                  day: {
                    apr: poolInfo.day.apr,
                    volume: poolInfo.day.volume,
                    volumeFee: poolInfo.day.volumeFee,
                  },
                  position: {
                    tokenAmountA: position.tokenA.amountInUSD,
                    tokenAmountB: position.tokenB.amountInUSD,
                    tokenARewardInUSD: position.tokenA.rewardInUSD,
                    tokenBRewardInUSD: position.tokenB.rewardInUSD,
                    rewardInUSD: position.rewardToken.rewardInUSD,
                  },
                }),
              })
            ),
            {
              caption: readFileSync(
                "locale/en/position/position-detail.md",
                "utf-8"
              )
                .replace(
                  "%algorithm%",
                  format(algorithm === "spot" ? "2️⃣ Spot" : "☘️ Single Sided")
                )
                .replace(
                  "%active%",
                  cleanText(active ? "🟢 Active" : "🔴 Not active")
                )
                .replace("%position_id%", cleanText(positionId))
                .replace("%name%", cleanText(name)),
              parse_mode: "MarkdownV2",
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    "☘️ Generate Reward Card",
                    format("pnl-%", positionId)
                  ),
                ],
                [
                  Markup.button.callback(
                    "🎁 Claim Reward",
                    format("claim_rewards-%", positionId)
                  ),
                ],
                [
                  Markup.button.callback(
                    "🅇 Close Position",
                    format("close_position-%", positionId)
                  ),
                ],
              ]).reply_markup,
            }
          );
        }
      }
    }

    await sleep(2000);
  }
};
