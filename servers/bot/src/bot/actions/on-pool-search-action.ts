import { Context, Markup } from "telegraf";
import { format } from "@raliqbot/shared";

import { getEnv } from "../../core";
import { cleanText, readFileSync } from "../utils";

export const onPoolSearchAction = async (context: Context) => {
  const inlineQuery = context.inlineQuery;
  if (inlineQuery) {
    const query = inlineQuery.query;
    if (query.trim().length < 2) return;

    const pools = (
      await Promise.all([
        context.raydium.api
          .fetchPoolByMints({ mint1: query, sort: "apr30d" })
          .then((pools) => pools.data),
        context.raydium.api.fetchPoolById({ ids: query }),
      ])
    ).flat();

    if (pools.length > 0) {
      return context.answerInlineQuery(
        pools.map((pool) => {
          const name = format("%-%", pool.mintA.symbol, pool.mintB.symbol);
          //const photoUrl = format("%/%", getEnv("MEDIA_APP_URL"), pool.id);

          return {
            id: pool.id,
            type: "article" as const,
            title: name,
            thumbnail_url: pool.mintA.logoURI,
            description: format(
              "Price % SOL/ 24hr Fee/ TVL $% / Fee rate % / Price change %",
              pool.price,
              pool.tvl,
              pool.feeRate,
              pool.day
            ),
            hide_url: true,
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "➕ Open Position",
                  format("createPosition-%", pool.id)
                ),
              ],
            ]).reply_markup,
            input_message_content: {
              is_flexible: true,
              link_preview_options: {
                // url: photoUrl,
                show_above_text: true,
                prefer_large_media: true,
              },
              // photo_url: photoUrl,
              message_text: readFileSync(
                "locale/en/search-pair/search-result.md",
                "utf-8"
              ).replace("%name%", cleanText(name)),
              parse_mode: "MarkdownV2" as const,
            },
          };
        })
      );
    }
  }
};
