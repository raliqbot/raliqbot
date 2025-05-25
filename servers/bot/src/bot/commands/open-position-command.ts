import { format } from "@raliqbot/shared";
import { isValidAddress, isValidClmm } from "@raliqbot/lib";
import { Input, Markup, type Context, type Telegraf } from "telegraf";
import { type ApiV3PoolInfoConcentratedItem } from "@raydium-io/raydium-sdk-v2";

import { buildMediaURL } from "../../core";
import { atomic } from "../utils/atomic";
import { getPoolInfoOrCachedPoolInfo } from "../../utils/cache";
import { cleanText, privateFunc, readFileSync } from "../utils";
import { openPositionSceneId } from "../scenes/open-position-scene";

export const onOpenPosition = atomic(async (context: Context) => {
  const message = context.message;
  let text =
    message && "text" in message
      ? message.text
      : context.callbackQuery && "data" in context.callbackQuery
      ? context.callbackQuery.data
      : undefined;

  if (text) {
    const [, address] = text.replace(/\/start?(\s+)/, "").split(/\s+|-/);

    if (address) {
      const mints = address.split(/,/g);
      let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;

      const poolInfos = await getPoolInfoOrCachedPoolInfo(context, ...mints);
      for (const pool of poolInfos)
        if (isValidClmm(pool.programId)) {
          poolInfo = pool as ApiV3PoolInfoConcentratedItem;
          break;
        }

      if (poolInfo) {
        context.session.createPosition = {
          ...context.session.createPosition,
          info: poolInfo,
          amount: context.session.openPosition
            ? context.session.openPosition.amount
            : undefined,
        };

        const name = format(
          "%/%",
          poolInfo.mintA.symbol,
          poolInfo.mintB.symbol
        ).replace(/\s/g, "");

        return context.replyWithPhoto(
          Input.fromURLStream(
            buildMediaURL("prefetched/open-graph/", {
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
              }),
            })
          ),
          {
            caption: readFileSync(
              "locale/en/search-pair/search-result.md",
              "utf-8"
            )
              .replace("%pool_id%", cleanText(poolInfo.id))
              .replace("%name%", cleanText(name)),
            parse_mode: "MarkdownV2" as const,
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "⚖️ Spot",
                  format("createPosition_spot_%", poolInfo.id)
                ),
                Markup.button.callback(
                  "🧩 Single Sided",
                  format("createPosition_s_%", poolInfo.id)
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
});

export const openPositionCommand = async (telegraf: Telegraf) => {
  const onOpenPosition = privateFunc((context: Context) => {
    const text =
      context.message && "text" in context.message
        ? context.message.text
        : context.callbackQuery && "data" in context.callbackQuery
        ? context.callbackQuery.data
        : undefined;

    if (text) {
      const [, ...values] = text.split(/\s/g);
      let amount: number | undefined;
      let address: string | undefined;

      for (const value of values) {
        if (isValidAddress(value)) address = value;
        if (Number.isInteger(parseFloat(value))) amount = parseFloat(value);
      }

      if (values.length > 0) {
        if (!(address && amount)) {
          return context.replyWithMarkdownV2(
            readFileSync("locale/en/open-position/invalid-command.md", "utf-8")
          );
        }
      }

      context.session.openPosition = {
        address,
        amount,
      };

      return context.scene.enter(openPositionSceneId);
    }
  });

  const commandFilter = /^open_position(?:-([1-9A-HJ-NP-Za-km-z]{32,44}))?$/;

  telegraf.command(commandFilter, onOpenPosition);
  telegraf.action(commandFilter, onOpenPosition);
};

openPositionCommand.commandName = "open_position";
openPositionCommand.help =
  "open new position for a pool. Optional SOL amount or pair address.";
