import Decimal from "decimal.js";
import { format } from "@raliqbot/shared";
import { CLMM_PROGRAM_ID, TickUtils } from "@raydium-io/raydium-sdk-v2";
import { Input, Markup, type Context, type Telegraf } from "telegraf";

import { atomic } from "../utils/atomic";
import { buildMediaURL } from "../../core";
import { dexscreener } from "../../instances";
import { cleanText, privateFunc, readFileSync } from "../utils";
import { getPosiitionsOrCachedPositions } from "../../utils/cache";

export const onPortfolioDetail = privateFunc(
  atomic(async (context: Context) => {
    const text =
      context.message && "text" in context.message
        ? context.message.text
        : context.callbackQuery && "data" in context.callbackQuery
        ? context.callbackQuery.data
        : undefined;

    if (text) {
      const [, ...addresses] = text.replace(/start/, String()).split(/-|_/g);
      const positions = await getPosiitionsOrCachedPositions(
        context,
        dexscreener,
        CLMM_PROGRAM_ID,
        ...addresses
      );

      return positions.map(({ poolInfo, ...position }) => {
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

        const media = Input.fromURLStream(
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
        );

        const extras = {
          caption: readFileSync(
            "locale/en/position/position-detail.md",
            "utf-8"
          )
            .replace(
              "%algorithm%",
              format(algorithm === "spot" ? "⚖️ Spot" : "☘️ Single Sided")
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
                "🔁 Refresh",
                format("portfolioDetail-%", positionId)
              ),
            ],
            [
              Markup.button.callback(
                "🅇 Close Position",
                format("close_position-%", positionId)
              ),
            ],
          ]).reply_markup,
        } as const;

        return context.callbackQuery && "data" in context.callbackQuery
          ? context.editMessageMedia({ media, type: "photo" }, extras)
          : context.replyWithPhoto(media, extras);
      });
    }
  })
);

export const portfolioDetailCommand = (telegraf: Telegraf) => {
  telegraf.action("portfolioDetail", onPortfolioDetail);
  telegraf.command("portfolioDetail", onPortfolioDetail);
};

portfolioDetailCommand.commandName = "portfolio";
portfolioDetailCommand.help =
  "Get your opened positions, include positionId to filter a particular position.";
