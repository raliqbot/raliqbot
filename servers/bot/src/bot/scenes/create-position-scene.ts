import { Markup, Scenes } from "telegraf";
import { createPosition } from "@raliqbot/lib";
import { Raydium } from "@raydium-io/raydium-sdk-v2";

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
        const rpcPoolInfo = await context.raydium.clmm.getRpcClmmPoolInfo({
          poolId: info.id,
        });
        info.price = rpcPoolInfo.currentPrice;

        const delta = info.price * 0.1;
        const startPrice = info.price - delta;
        const endPrice = info.price + delta;

        const [signatures, nftMint] = await createPosition(
          context.raydium as Raydium,
          { mint: "So11111111111111111111111111111111111111112", amount },
          info.id,
          [startPrice, endPrice],
          0.05
        );

        return context.reply([signatures, nftMint].join(","));
      }
      return context.scene.leave();
    }
  }
);
