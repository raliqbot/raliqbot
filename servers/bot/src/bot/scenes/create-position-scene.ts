import { Markup, Scenes } from "telegraf";
import { createPosition } from "@raliqbot/lib";

import { format } from "../../core";
import { cleanText, readFileSync } from "../utils";

export const createPositionSceneId = "create-position-scene";

export const createPositionScene = new Scenes.WizardScene(
  createPositionSceneId,
  async (context) => {
    await context.replyWithMarkdownV2(
      "Enter amount of SOL you want to use to create this LP position",
      Markup.forceReply()
    );

    return context.wizard.next();
  },
  async (context) => {
    const message = context.message;
    if (message && "text" in message) {
      const amount = Number(message.text);
      const { info } = context.session.createPosition;
      if (info) {
        const name = format("%/%", info.mintA.symbol, info.mintB.symbol);
        const rpcPoolInfo = await context.raydium.clmm.getRpcClmmPoolInfo({
          poolId: info.id,
        });
        info.price = rpcPoolInfo.currentPrice;

        const [[, , signature], nftMint] = await createPosition(
          context.raydium,
          {
            slippage: 0.05,
            singleSided: "MintA",
            input: {
              mint: "So11111111111111111111111111111111111111112",
              amount,
            },
            poolId: info.id,
            tickPercentage: [0.01, 0],
          }
        );

        return context.replyWithMarkdownV2(
          readFileSync("locale/en/create-position/position-created.md", "utf-8")
            .replace("%name%", cleanText(name))
            .replace("%signature%", cleanText(signature))
            .replace("%positionId%", cleanText(nftMint)),
          {
            link_preview_options: {
              is_disabled: true,
            },
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.url(
                  "🔗 View in Explorer",
                  format("https://solscan.io/tx/%", signature)
                ),
              ],
            ]).reply_markup,
          }
        );
      }
      return context.scene.leave();
    }
  }
);
