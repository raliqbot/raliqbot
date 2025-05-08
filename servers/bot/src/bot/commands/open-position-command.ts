import { format } from "@raliqbot/shared";
import { isValidClmm } from "@raliqbot/lib";
import { type Context, Input, Markup, type Telegraf } from "telegraf";
import {
  type ApiV3PoolInfoConcentratedItem,
  PoolFetchType,
} from "@raydium-io/raydium-sdk-v2";

import { buildMediaURL } from "../../core";
import { cleanText, isValidAddress, readFileSync } from "../utils";
import { openPositionSceneId } from "../scenes/open-position-scene";

export const onOpenPosition = async (context: Context) => {
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

      if (mints.length > 0) {
        if (context.raydium.cluster === "mainnet") {
          const [mint1, mint2] = mints;

          const poolInfos = (
            await Promise.all([
              context.raydium.api
                .fetchPoolByMints({
                  mint1,
                  mint2,
                  sort: "fee24h",
                  type: PoolFetchType.Concentrated,
                })
                .then((poolInfos) => poolInfos.data),
              context.raydium.api.fetchPoolById({
                ids: address,
              }),
            ])
          ).flat() as ApiV3PoolInfoConcentratedItem[];

          for (const pool of poolInfos)
            if (isValidClmm(pool.programId)) {
              poolInfo = pool as ApiV3PoolInfoConcentratedItem;
              break;
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
            amount: context.session.openPosition
              ? context.session.openPosition.amount
              : undefined,
          };

          const name = format(
            "%-%",
            poolInfo.mintA.symbol,
            poolInfo.mintB.symbol
          ).replace(/\s/g, "");

          return context.replyWithPhoto(
            Input.fromURLStream(
              buildMediaURL(format("%/open-graph/", poolInfo.id))
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
  }

  return context.replyWithMarkdownV2(
    readFileSync("locale/en/create-position/invalid-command.md", "utf-8")
  );
};

export const openPositionCommand = async (telegraf: Telegraf) => {
  const onOpenPosition = (context: Context) => {
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
  };

  const commandFilter = /^open_position(?:-([1-9A-HJ-NP-Za-km-z]{32,44}))?$/;

  telegraf.command(commandFilter, onOpenPosition);
  telegraf.action(commandFilter, onOpenPosition);
};

openPositionCommand.commandName = "open_position";
openPositionCommand.help =
  "open new position for a pool. Optional SOL amount or pair address.";
