import { isValidClmm } from "@raliqbot/lib";
import { Input, Markup, type Context, type Telegraf } from "telegraf";
import {
  ApiV3PoolInfoConcentratedItem,
  PoolFetchType,
} from "@raydium-io/raydium-sdk-v2";

import { buildMediaURL, format } from "../../core";
import { cleanText, isValidAddress, readFileSync } from "../utils";

const commandFilter = /^open(?:-([1-9A-HJ-NP-Za-km-z]{32,44}))?$/;

export const onOpenPosition = async (context: Context) => {
  const message = context.message;
  let text =
    message && "text" in message
      ? message.text
      : context.callbackQuery && "data" in context.callbackQuery
      ? context.callbackQuery.data
      : undefined;
  text = text?.replace("/start ", "");

  if (text) {
    const [, address] = text.split(/\s+|-/);

    if (address) {
      let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;

      if (context.raydium.cluster === "mainnet") {
        const mints = address.split(/,/g).filter(isValidAddress);

        if (mints.length > 0) {
          const [mint1, mint2] = mints;

          const poolInfos = await context.raydium.api.fetchPoolByMints({
            mint1,
            mint2,
            sort: "fee24h",
            type: PoolFetchType.Concentrated,
          });

          if (poolInfos.count > 0) {
            for (const pool of poolInfos.data)
              if (isValidClmm(pool.programId)) {
                poolInfo = pool as ApiV3PoolInfoConcentratedItem;
                break;
              }
          } else {
            const pools = await context.raydium.api.fetchPoolById({
              ids: address,
            });
            for (const pool of pools)
              if (isValidClmm(pool.programId)) {
                poolInfo = pool as ApiV3PoolInfoConcentratedItem;
                break;
              }
          }
        } else {
          const pool = await context.raydium.clmm
            .getPoolInfoFromRpc(address)
            .catch(() => null);
          if (pool) poolInfo = pool.poolInfo;
        }

        if (poolInfo) {
          context.session.createPosition = {
            ...context.session.createPosition,
            info: poolInfo,
          };

          const name = format(
            "%-%",
            (poolInfo.mintA.symbol ?? poolInfo.mintA.name).toUpperCase(),
            (poolInfo.mintB.symbol ?? poolInfo.mintB.name).toUpperCase()
          ).replace(/\s/g, "");

          return context.replyWithPhoto(
            Input.fromURLStream(
              buildMediaURL(format("%/open-graph/", poolInfo.id))
            ),

            {
              caption: readFileSync(
                "locale/en/search-pair/search-result.md",
                "utf-8"
              ).replace("%name%", cleanText(name)),
              parse_mode: "MarkdownV2" as const,
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    "➕ Open Position",
                    format("createPosition-%", poolInfo.id)
                  ),
                ],
              ]).reply_markup,
            }
          );
        }

        return context.replyWithMarkdownV2(
          readFileSync("locale/en/create-position/not-found.md", "utf-8")
        );
      }
    }

    return context.replyWithMarkdownV2(
      readFileSync("locale/en/create-position/invalid-command.md", "utf-8")
    );
  }
};

export const openPositionCommand = async (telegraf: Telegraf) => {
  telegraf.action(commandFilter, onOpenPosition);
  telegraf.command(commandFilter, onOpenPosition);
};
