import { createPosition } from "@raliqbot/lib";
import { type Context, Input, Markup, Scenes } from "telegraf";

import { buildMediaURL, format } from "../../core";
import { catchBotRuntimeError, cleanText, readFileSync } from "../utils";

export const createPositionSceneId = "create-position-scene";

const processTx = async (context: Context, amount: number) => {
  const { info } = context.session.createPosition;
  if (info) {
    const name = format("%/%", info.mintA.symbol, info.mintB.symbol);
    const rpcPoolInfo = await context.raydium.clmm.getRpcClmmPoolInfo({
      poolId: info.id,
    });
    info.price = rpcPoolInfo.currentPrice;

    const [[, , signature], nftMint] = await createPosition(context.raydium, {
      slippage: Number(context.user.settings.slippage),
      singleSided: "MintA",
      input: {
        mint: "So11111111111111111111111111111111111111112",
        amount,
      },
      poolId: info.id,
      tickPercentage: [0.1, 0],
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
              "❌ Close Position",
              format("close-%", nftMint)
            ),
          ],
        ]).reply_markup,
      }
    );
  }
  return context.scene.leave();
};

export const createPositionScene = new Scenes.WizardScene(
  createPositionSceneId,
  async (context) => {
    if (context.session.createPosition.amount) {
      await processTx(context, context.session.createPosition.amount);
      return context.scene.leave();
    }

    await context.replyWithMarkdownV2(
      "Enter amount of SOL you want to use to create this LP position",
      Markup.forceReply()
    );

    return context.wizard.next();
  },
  catchBotRuntimeError(async (context) => {
    const message = context.message;

    if (message && "text" in message) {
      const amount = Number(message.text.replace(/\s/g, ""));
      return processTx(context, amount);
    }
  })
);
