import Decimal from "decimal.js";
import { format } from "@raliqbot/shared";
import { Input, Markup } from "telegraf";
import { createPosition } from "@raliqbot/lib";

import { db } from "../../../instances";
import { buildMediaURL } from "../../../core";
import { catchBotRuntimeError, cleanText, readFileSync } from "../../utils";
import { createPositions } from "../../../controllers/positions.controller";

export const openPosition = catchBotRuntimeError(async (context) => {
  const { info, amount, range, algorithm, skipSwapA, skipSwapB } =
    context.session.createPosition;

  if (info && amount && range && algorithm) {
    const name = format("%/%", info.mintA.symbol, info.mintB.symbol);
    const [
      ,
      nftMint,
      { upperTick, lowerTick, liquidity, baseAmountIn, quoteAmountIn },
    ] = await createPosition(
      context.raydium,
      {
        range,
        skipSwapA,
        skipSwapB,
        rangeBias: false,
        slippage: Number(context.user.settings.slippage),
        input: {
          amount,
          mint: "So11111111111111111111111111111111111111112",
        },
        poolId: info.id,
      },
      {
        onSwapA(signature, amount) {
          context.session.createPosition.skipSwapB = true;
          return context.replyWithMarkdownV2(
            readFileSync("locale/en/create-position/swap-token.md", "utf-8")
              .replace("%amount%", cleanText(amount.toFixed(2)))
              .replace("%symbol%", cleanText(info.mintA.symbol)),
            Markup.inlineKeyboard([
              Markup.button.url(
                "View in explorer",
                format("https://solscan.io/tx/%", signature)
              ),
            ])
          );
        },
        onSwapB(signature, amount) {
          context.session.createPosition.skipSwapB = true;

          return context.replyWithMarkdownV2(
            readFileSync("locale/en/create-position/swap-token.md", "utf-8")
              .replace("%amount%", cleanText(amount.toFixed(2)))
              .replace("%symbol%", cleanText(info.mintA.symbol)),
            Markup.inlineKeyboard([
              Markup.button.url(
                "View in explorer",
                format("https://solscan.io/tx/%", signature)
              ),
            ])
          );
        },
        onOpenPosition(signature) {
          return context.replyWithPhoto(
            Input.fromURLStream(buildMediaURL(format("%/open-graph", info.id))),
            {
              caption: readFileSync(
                "locale/en/create-position/position-created.md",
                "utf-8"
              )
                .replace("%name%", cleanText(name))
                .replace("%signature%", cleanText(signature)),
              parse_mode: "MarkdownV2",
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.url(
                    "🔗 View in Explorer",
                    format("https://solscan.io/tx/%", signature)
                  ),
                ],
                [
                  Markup.button.callback(
                    "🅇 Close Position",
                    format("close_position-%", nftMint)
                  ),
                ],
              ]).reply_markup,
            }
          );
        },
      }
    ).catch(async (error) => {
      const { message_id } = await context.replyWithMarkdownV2(
        readFileSync(
          "locale/en/create-position/create-error.md",
          "utf-8"
        ).replace("%error%", cleanText(error)),
        Markup.inlineKeyboard([
          Markup.button.callback("↪️ Retry", "open-position"),
        ])
      );
      context.session.messageIdsStack.push(message_id);
      return Promise.reject(error);
    });

    let amountA: number = 0;
    let amountB: number = 0;

    if (baseAmountIn)
      amountA = new Decimal(baseAmountIn.toString())
        .div(Math.pow(10, info.mintA.decimals))
        .toNumber();
    if (quoteAmountIn)
      amountB = new Decimal(quoteAmountIn.toString())
        .div(Math.pow(10, info.mintB.decimals))
        .toNumber();

    await createPositions(db, {
      algorithm,
      id: nftMint,
      pool: info.id,
      enabled: false,
      wallet: context.user.wallet.id,
      metadata: {
        upperTick,
        lowerTick,
        amountA,
        amountB,
        liquidity: liquidity.toString(),
        stopLossPercentage: 0.75,
      },
    });

    context.session.openPosition = {};
    context.session.createPosition = { range: [0.15, 0.15] };
  }

  return context.scene.leave();
});
