import { createPosition } from "@raliqbot/lib";
import { Input, Markup, Scenes } from "telegraf";

import { buildMediaURL, format } from "../../core";
import { catchBotRuntimeError, cleanText, readFileSync } from "../utils";

export const createPositionSceneId = "create-position-scene";

export const createPositionScene = new Scenes.WizardScene(
  createPositionSceneId,
  async (context) => {
    await context.replyWithMarkdownV2(
      readFileSync("locale/en/create-position/choose-algorithm.md", "utf-8"),
      Markup.inlineKeyboard([
        Markup.button.callback("⚖️ Spot", "spot"),
        Markup.button.callback("🧩 Single Sided", "single-sided"),
      ])
    );

    return context.wizard.next();
  },
  async (context) => {
    const algorithm =
      context.callbackQuery && "data" in context.callbackQuery
        ? (context.callbackQuery.data.replace(/\s+/g, "") as
            | "single-sided"
            | "spot")
        : undefined;

    if (algorithm && ["spot", "single-sided"].includes(algorithm)) {
      const info = context.session.createPosition.info;
      context.session.createPosition.algorithm = algorithm;

      if (info && algorithm === "single-sided") {
        await context.replyWithMarkdownV2(
          readFileSync(
            "locale/en/create-position/select-token-side.md",
            "utf-8"
          ),
          Markup.inlineKeyboard([
            ...(
              [
                ["MintA", info.mintA],
                ["MintB", info.mintB],
              ] as const
            ).map(([mintSide, mint]) =>
              Markup.button.callback(mint.symbol, mintSide)
            ),
          ])
        );

        return context.wizard.next();
      } else return context.wizard.next();
    }
  },
  async (context) => {
    const onNext = async () => {
      if (!context.session.createPosition.amount)
        await context.replyWithMarkdownV2(
          "Enter amount of SOL you want to use to create this LP position",
          Markup.forceReply()
        );

      return context.wizard.next();
    };

    if (context.session.createPosition.algorithm === "single-sided") {
      const singleSided =
        context.callbackQuery && "data" in context.callbackQuery
          ? (context.callbackQuery.data.replace(/\s+/g, "") as
              | "MintA"
              | "MintB")
          : undefined;

      if (singleSided && ["MintA", "MintB"].includes(singleSided)) {
        context.session.createPosition.singleSided = singleSided;

        return onNext();
      }
    } else onNext();
  },
  catchBotRuntimeError(async (context) => {
    const amount =
      context.message && "text" in context.message
        ? parseFloat(context.message.text)
        : context.session.createPosition.amount;

    if (Number.isNaN(amount)) return;

    const { info, singleSided } = context.session.createPosition;

    context.session.openPosition = {};
    context.session.createPosition = {};

    if (info && amount) {
      const name = format("%/%", info.mintA.symbol, info.mintB.symbol);
      const rpcPoolInfo = await context.raydium.clmm.getRpcClmmPoolInfo({
        poolId: info.id,
      });
      info.price = rpcPoolInfo.currentPrice;
      const tickPercentage: [number, number] = singleSided
        ? singleSided === "MintA"
          ? [0.2, 0]
          : [0, 0.2]
        : [0.2, 0.2];

      const [[, , signature], nftMint] = await createPosition(context.raydium, {
        tickPercentage,
        slippage: Number(context.user.settings.slippage),
        input: {
          amount,
          mint: "So11111111111111111111111111111111111111112",
        },
        poolId: info.id,
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
                format("close-%", nftMint)
              ),
            ],
          ]).reply_markup,
        }
      );
    }

    return context.scene.leave();
  })
);
