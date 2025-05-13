import Decimal from "decimal.js";
import { format } from "@raliqbot/shared";
import { Input, Markup } from "telegraf";
import { createPosition } from "@raliqbot/lib";

import { db } from "../../../instances";
import { buildMediaURL } from "../../../core";
import { catchBotRuntimeError, cleanText, readFileSync } from "../../utils";
import { createPositions } from "../../../controllers/positions.controller";

export const openPosition = catchBotRuntimeError(async (context) => {
  const { info, amount, range, algorithm, singleSided } =
    context.session.createPosition;
  context.session.openPosition = {};
  context.session.createPosition = { range: [0.15, 0.15] };

  if (info && amount && range && algorithm) {
    const name = format("%/%", info.mintA.symbol, info.mintB.symbol);

    const [
      [, , signature],
      nftMint,
      { upperTick, lowerTick, liquidity, baseAmountIn, quoteAmountIn },
    ] = await createPosition(context.raydium, {
      range,
      rangeBias: false,
      slippage: Number(context.user.settings.slippage),
      input: {
        amount,
        mint: "So11111111111111111111111111111111111111112",
      },
      poolId: info.id,
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

    return context.replyWithPhoto(
      Input.fromURLStream(buildMediaURL(format("%/open-graph", info.id))),
      {
        caption: readFileSync(
          "locale/en/create-position/position-created.md",
          "utf-8"
        )
          .replace("%name%", cleanText(name))
          .replace("%signature%", cleanText(signature)),
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
  }

  return context.scene.leave();
});
