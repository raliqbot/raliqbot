import millify from "millify";
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
          .fetchPoolByMints({ mint1: query, sort: "fee24h" })
          .then((pools) => pools.data),
        context.raydium.api.fetchPoolById({ ids: query }),
      ])
    ).flat();
    console.log(pools.length);

    if (pools.length > 0) {
      return context.answerInlineQuery(
        pools
          .filter((pool) => pool && pool.mintA && pool.mintB)
          .slice(0, 32)
          .map((pool) => {
            const name = format("%/%", pool.mintA.symbol, pool.mintB.symbol);
            //const photoUrl = format("%/%", getEnv("MEDIA_APP_URL"), pool.id);

            return {
              id: pool.id,
              type: "article" as const,
              title: name,
              thumbnail_url: pool.mintA.logoURI,
              description: format(
                "Fee %, Liquidity $%, Volume 24H $%, Fee 24H $%, APR 24H %%",
                pool.feeRate * 100,
                millify(pool.tvl),
                millify(pool.day.volume),
                millify(pool.day.volumeFee),
                pool.day.apr.toFixed(2)
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
          }),
        { cache_time: 0 }
      );
    }
  }
};
