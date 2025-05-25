import Decimal from "decimal.js";
import { format } from "@raliqbot/shared";
import { getPortfolio } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID, TickUtils } from "@raydium-io/raydium-sdk-v2";
import { Input, Markup, type Context, type Telegraf } from "telegraf";

import { atomic } from "../utils/atomic";
import { dexscreemer } from "../../instances";
import { buildMediaURL } from "../../core";
import { cleanText, privateFunc, readFileSync } from "../utils";

export const portfolioCommand = (telegraf: Telegraf) => {
  const onPortfolio = privateFunc(
    atomic(async (context: Context) => {
      const text =
        context.message && "text" in context.message
          ? context.message.text
          : undefined;

      let porfolios = await getPortfolio(
        context.raydium,
        dexscreemer,
        CLMM_PROGRAM_ID
      );

      if (porfolios.length > 0) {
        return Promise.all(
          porfolios.map(({ pool: { poolInfo }, positions }) => {
            if (text) {
              const [, ...addresses] = text.split(/\s+/g);
              if (addresses.length > 0)
                positions = positions.filter((position) =>
                  addresses.includes(position.nftMint)
                );
            }

            const { tick: currentTick } = TickUtils.getPriceAndTick({
              poolInfo,
              price: new Decimal(poolInfo.price),
              baseIn: true,
            });

            return positions.map((position) => {
              context.session.cachedPositions[position.nftMint] = position;

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

              return context.replyWithPhoto(
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
                      format(
                        algorithm === "spot" ? "⚖️ Spot" : "☘️ Single Sided"
                      )
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
            });
          })
        );
      } else
        return context.replyWithMarkdownV2(
          readFileSync("locale/en/portfolio/no-open-position.md", "utf-8")
        );
    })
  );

  telegraf.action("portfolio", onPortfolio);
  telegraf.command("portfolio", onPortfolio);
};

portfolioCommand.commandName = "portfolio";
portfolioCommand.help =
  "Get your opened positions, include positionId to filter a particular position.";
