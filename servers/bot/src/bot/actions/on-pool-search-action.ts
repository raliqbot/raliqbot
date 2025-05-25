import millify from "millify";
import { format } from "@raliqbot/shared";
import { Context, Markup } from "telegraf";
import { isValidAddress } from "@raliqbot/lib";

import { atomic } from "../utils/atomic";
import { buildMediaURL } from "../../core";
import { cleanText, readFileSync } from "../utils";

export const onPoolSearchAction = atomic(async (context: Context) => {
  const inlineQuery = context.inlineQuery;
  if (inlineQuery) {
    const query = inlineQuery.query;
    if (query.trim().length < 2) return;
    const mints = query.split(/,/g).filter(isValidAddress);

    if (mints.length > 0) {
      const cachedPool = context.session.searchCache[query];

      const [mint1, mint2] = mints;

      const pools = cachedPool
        ? cachedPool
        : (
            await Promise.all([
              context.raydium.api
                .fetchPoolByMints({ mint1, mint2, sort: "fee24h" })
                .then((pools) => pools.data),
              context.raydium.api.fetchPoolById({ ids: query }),
            ])
          ).flat();

      if (!cachedPool) context.session.searchCache[query] = pools;

      const currentOffset = context.session.searchCache
        ? inlineQuery.offset
          ? Number(inlineQuery.offset)
          : 0
        : 0;

      if (pools.length > 0) {
        return context.answerInlineQuery(
          pools
            .filter((pool) => pool && pool.mintA && pool.mintB)
            .slice(0 + currentOffset, currentOffset + 32)
            .map((pool) => {
              const name = format("%/%", pool.mintA.symbol, pool.mintB.symbol);
              const photoUrl = buildMediaURL("prefetched/open-graph/", {
                data: JSON.stringify({
                  mintA: {
                    name: pool.mintA.name,
                    symbol: pool.mintA.symbol,
                    logoURI: pool.mintA.logoURI,
                    address: pool.mintA.address,
                  },
                  mintB: {
                    name: pool.mintB.name,
                    symbol: pool.mintB.symbol,
                    logoURI: pool.mintB.logoURI,
                    address: pool.mintB.address,
                  },
                  tvl: pool.tvl,
                  feeRate: pool.feeRate,
                  day: {
                    apr: pool.day.apr,
                    volume: pool.day.volume,
                    volumeFee: pool.day.volumeFee,
                  },
                }),
              });

              return {
                id: pool.id,
                type: "article" as const,
                title: name,
                thumbnail_width: 64,
                thumbnail_height: 32,
                thumbnail_url: buildMediaURL("prefetched/mint/", {
                  data: JSON.stringify({
                    data: {
                      mintA: {
                        name: pool.mintA.name,
                        symbol: pool.mintA.symbol,
                        logoURI: pool.mintA.logoURI,
                        address: pool.mintA.address,
                      },
                      mintB: {
                        name: pool.mintB.name,
                        symbol: pool.mintB.symbol,
                        logoURI: pool.mintB.logoURI,
                        address: pool.mintB.address,
                      },
                    },
                  }),
                }),
                description: readFileSync(
                  "locale/en/search-pair/search-description.md",
                  "utf-8"
                )
                  .replace("%fee%", String(pool.feeRate * 100))
                  .replace("%liquidity%", millify(pool.tvl))
                  .replace("%volume%", millify(pool.day.volume))
                  .replace("%fee_24h%", millify(pool.day.volumeFee))
                  .replace("%apr_24h%", pool.day.apr.toFixed(2)),
                hide_url: true,
                reply_markup: Markup.inlineKeyboard([
                  [
                    Markup.button.url(
                      "➕ Open Position",
                      format(
                        "https://t.me/%?start=%",
                        context.botInfo.username,
                        format("createPosition-%", pool.id)
                      )
                    ),
                  ],
                ]).reply_markup,
                input_message_content: {
                  is_flexible: true,
                  link_preview_options: {
                    url: photoUrl,
                    show_above_text: true,
                    prefer_large_media: true,
                  },
                  photo_url: photoUrl,
                  message_text: readFileSync(
                    "locale/en/search-pair/search-result.md",
                    "utf-8"
                  )
                    .replace("%pool_id%", cleanText(pool.id))
                    .replace("%name%", cleanText(name)),
                  parse_mode: "MarkdownV2" as const,
                },
              };
            }),
          { cache_time: 0, next_offset: String(currentOffset + 32) }
        );
      }
    }
  }
});
