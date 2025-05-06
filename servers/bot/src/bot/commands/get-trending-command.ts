import millify from "millify";
import { format } from "@raliqbot/shared";
import { Context, Markup, Telegraf } from "telegraf";

import { cleanText, readFileSync } from "../utils";


export const commandFilter = /trending(-\d+)?/;

export const getTrendingCommand = (telegraf: Telegraf) => {
  const onTrending = async (context: Context) => {
    const message =
      context.message && "text" in context.message
        ? context.message.text
        : context.callbackQuery && "data" in context.callbackQuery
        ? context.callbackQuery.data
        : undefined;

    if (message) {
      const [, page] = message.split(/-/g);
      let refinedPage = Number(page);
      refinedPage = Number.isNaN(refinedPage) ? 1 : refinedPage;

      const poolInfos = await context.raydium.api.getPoolList({
        sort: "fee24h",
        page: refinedPage,
        pageSize: 5,
      });

      if (poolInfos.data.length > 0) {
        const buttons = [];

        if (refinedPage > 1)
          buttons.push(
            Markup.button.callback(
              "⬅️ Previous",
              format("trending-%", refinedPage - 1)
            )
          );

        if (poolInfos.hasNextPage)
          buttons.push(
            Markup.button.callback(
              "Next ➡️",
              format("trending-%", refinedPage + 1)
            )
          );

        const message = readFileSync(
          "locale/en/trending/trending-token.md",
          "utf-8"
        )
          .replace("%page%", refinedPage.toString())
          .replace("%page_count%", poolInfos.count.toString())
          .replace(
            "%list%",
            poolInfos.data
              .map((poolInfo, index) =>
                readFileSync(
                  "locale/en/trending/trending-token-detail.md",
                  "utf-8"
                )
                  .replace(
                    "%index%",
                    (index + 1 + (refinedPage - 1) * 5).toString()
                  )
                  .replace(
                    "%name%",
                    cleanText(
                      format(
                        "%/%",
                        poolInfo.mintA.symbol,
                        poolInfo.mintB.symbol
                      )
                    )
                  )
                  .replace(
                    "%link%",
                    format(
                      "https://t.me/%?start=%",
                      context.botInfo.username,
                      format("open-%", poolInfo.id)
                    )
                  )
                  .replace(
                    "%fees%",
                    cleanText((poolInfo.feeRate * 100).toString())
                  )
                  .replace(
                    "%liquidity%",
                    cleanText(poolInfo.tvl.toLocaleString())
                  )
                  .replace("%volume%", cleanText(millify(poolInfo.day.volume)))
                  .replace(
                    "%fees_24h%",
                    cleanText(millify(poolInfo.day.volumeFee))
                  )
                  .replace(
                    "%apr%",
                    cleanText(poolInfo.day.apr.toFixed(2).toString())
                  )
              )
              .join("\n")
          );
        return context.callbackQuery && page
          ? context.editMessageText(message, {
              parse_mode: "MarkdownV2",
              reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
            })
          : context.replyWithMarkdownV2(
              message,
              Markup.inlineKeyboard(buttons)
            );
      }
    }
  };

  telegraf.action(commandFilter, onTrending);
  telegraf.command(commandFilter, onTrending);
};
