import millify from "millify";
import { Context, Markup } from "telegraf";
import { format } from "@raliqbot/shared";

import { dexscreemer } from "../../instances";
import { cleanText, readFileSync } from "../utils";

export const onPoolSearchAction = async (context: Context) => {
  const inlineQuery = context.inlineQuery;
  if (inlineQuery) {
    const query = inlineQuery.query;
    if (query.trim().length < 2) return;

    const pairs = await dexscreemer.search
      .searchPairs(query)
      .then(({ data }) =>
        data.pairs.filter((pair) => pair.dexId === "raydium" && pair.info)
      );

    if (pairs.length > 0) {
      return context.answerInlineQuery(
        pairs.map((pair) => {
          const name = format(
            "%-%",
            pair.baseToken.symbol,
            pair.quoteToken.symbol
          );

          return {
            id: pair.pairAddress,
            type: "article" as const,
            title: name,
            thumbnail_url: pair.info.imageUrl,
            description: format(
              "Price $%/ MCap $% / Volume 24h % / Price change %",
              pair.priceUsd,
              millify(pair.marketCap),
              pair.volume["24h"],
              pair.priceChange["24"]
            ),
            hide_url: true,
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "➕ Open Position",
                  format("create-position-%", pair.pairAddress)
                ),
              ],
            ]).reply_markup,
            input_message_content: {
              is_flexible: true,
              link_preview_options: {
                url: pair.info.openGraph,
                show_above_text: true,
                prefer_large_media: true,
              },
              photo_url: pair.info.openGraph,
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
