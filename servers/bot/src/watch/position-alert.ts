import type { z } from "zod";
import { format } from "@raliqbot/shared";
import type { getPortfolio } from "@raliqbot/lib";
import { Input, Markup, type Telegraf } from "telegraf";
import type { ApiV3PoolInfoConcentratedItem } from "@raydium-io/raydium-sdk-v2";

import type { Database } from "../db";
import { buildMediaURL } from "../core";
import { positions } from "../db/schema";
import { readFileSync, cleanText } from "../bot/utils";
import type { selectUserSchema, selectWalletSchema } from "../db/zod";

export const positionAlert = async (
  db: Database,
  bot: Telegraf,
  poolInfo: ApiV3PoolInfoConcentratedItem,
  position: Awaited<
    ReturnType<typeof getPortfolio>
  >[number]["positions"][number],
  positionIsActive: boolean,
  wallet: Pick<z.infer<typeof selectWalletSchema>, "id" | "key"> & {
    user: Pick<z.infer<typeof selectUserSchema>, "id">;
  }
) => {
  const positionId = position.nftMint;
  const name = format("%/%", poolInfo.mintA.symbol, poolInfo.mintB.symbol);
  const algorithm =
    position.tickLower !== 0 && position.tickUpper !== 0
      ? "spot"
      : "single-sided";

  await db
    .insert(positions)
    .values({
      id: position.nftMint,
      pool: poolInfo.id,
      wallet: wallet.id,
      enabled: positionIsActive,
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
      target: [positions.id],
      set: { enabled: positionIsActive },
    });

  await bot.telegram.sendPhoto(
    wallet.user.id,
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
      caption: readFileSync("locale/en/position/position-detail.md", "utf-8")
        .replace(
          "%algorithm%",
          format(algorithm === "spot" ? "2️⃣ Spot" : "☘️ Single Sided")
        )
        .replace(
          "%active%",
          cleanText(positionIsActive ? "🟢 Active" : "🔴 Not active")
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
};
