import { createPosition } from "@raliqbot/lib";
import { Context, Input, Markup, Scenes } from "telegraf";

import { db } from "../../instances";
import { buildMediaURL, format } from "../../core";
import { authenticateUser } from "../middlewares/authenticate-user";
import { catchBotRuntimeError, cleanText, readFileSync } from "../utils";
import { createPositions } from "../../controllers/positions.controller";
import Decimal from "decimal.js";

const confirmPosition = async (context: Context) => {
  const { info, messageId, amount, range } = context.session.createPosition;

  if (info && amount) {
    const message = readFileSync(
      "locale/en/create-position/position-config.md",
      "utf-8"
    )
      .replace(
        "%name%",
        cleanText(format("%/%", info.mintA.symbol, info.mintB.symbol))
      )
      .replace("%range%", cleanText(range.join(", ")))
      .replace("%price%", cleanText(info.price.toFixed(2)))
      .replace("%amount%", cleanText(amount.toFixed(2)))
      .replace(
        "%strategy%",
        cleanText(context.session.createPosition.algorithm!)
      );

    const reply_markup = Markup.inlineKeyboard([
      [
        Markup.button.callback("✏️ Edit Range", "edit-range"),
        Markup.button.callback("＋ Open Position", "open-position"),
      ],
      [Markup.button.callback("🅇 Cancel", "cancel")],
    ]).reply_markup;

    if (messageId)
      await context.telegram.editMessageText(
        context.chat!.id,
        messageId,
        undefined,
        message,
        { reply_markup, parse_mode: "MarkdownV2" }
      );

    const { message_id } = await context.replyWithMarkdownV2(message, {
      reply_markup,
    });

    context.session.createPosition.messageId = message_id;
  }
};

export const createPositionSceneId = "create-position-scene";
export const createPositionScene = new Scenes.WizardScene(
  createPositionSceneId,
  async (context) => {
    const message = await context.replyWithMarkdownV2(
      readFileSync("locale/en/create-position/choose-algorithm.md", "utf-8"),
      Markup.inlineKeyboard([
        [
          Markup.button.callback("⚖️ Spot", "spot"),
          Markup.button.callback("🧩 Single Sided", "single-sided"),
        ],
        [Markup.button.callback("🅇 Cancel", "cancel")],
      ])
    );

    context.session.messageIdsStack.push(message.message_id);

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
        const message = await context.replyWithMarkdownV2(
          readFileSync(
            "locale/en/create-position/select-token-side.md",
            "utf-8"
          ),
          Markup.inlineKeyboard([
            (
              [
                ["MintA", info.mintA],
                ["MintB", info.mintB],
              ] as const
            ).map(([mintSide, mint]) =>
              Markup.button.callback(mint.symbol, mintSide)
            ),
            [Markup.button.callback("🅇 Cancel", "cancel")],
          ])
        );

        context.session.messageIdsStack.push(message.message_id);

        return context.wizard.next();
      } else return context.wizard.next();
    }
  },
  async (context) => {
    const onNext = async () => {
      if (!context.session.createPosition.amount) {
        const message = await context.replyWithMarkdownV2(
          "Enter amount of SOL you want to use to create this LP position",
          Markup.forceReply()
        );

        context.session.messageIdsStack.push(message.message_id);
      }

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
        if (singleSided === "MintA")
          context.session.createPosition.range = [0, 0.15];
        else context.session.createPosition.range = [0.15, 0];

        return onNext();
      }
    } else onNext();
  },
  async (context) => {
    const text =
      context.message && "text" in context.message
        ? context.message.text
        : undefined;

    if (text) {
      const amount = parseFloat(text);
      if (!Number.isNaN(amount)) context.session.createPosition.amount = amount;
      await confirmPosition(context);
      return context.wizard.next();
    }
  },
  async (context) => {
    if (context.callbackQuery && "data" in context.callbackQuery) {
      const data = context.callbackQuery.data;
      if (data === "edit-range") {
        const message = await context.replyWithMarkdownV2(
          readFileSync("locale/en/create-position/edit-range.md", "utf-8"),
          Markup.forceReply()
        );

        context.session.messageIdsStack.push(message.message_id);

        return context.wizard.next();
      }
    }
  },
  async (context) => {
    const text =
      context.message && "text" in context.message
        ? context.message.text
        : undefined;

    if (text) {
      let values = text
        .split(/\s+|,/)
        .map(parseFloat)
        .filter((value) => !Number.isNaN(value));

      values = values.map((value) => (value > 1 ? value / 100 : value));

      const { algorithm, singleSided } = context.session.createPosition;
      if (algorithm === "single-sided") {
        if (singleSided === "MintA") values = [0, values[0]];
        else values = [values[0], 0];
      } else {
        if (values.length < 2)
          return context.replyWithMarkdownV2(
            readFileSync("locale/en/create-position/invalid-range.md", "utf-8")
          );
      }

      context.session.createPosition.range = values as [number, number];

      return confirmPosition(context);
    }
  }
);

createPositionScene.action("cancel", (context) => {
  context.deleteMessages(context.session.messageIdsStack);
  context.session.messageIdsStack = [];
  return context.scene.leave();
});

createPositionScene.use(authenticateUser).action(
  "open-position",
  catchBotRuntimeError(async (context) => {
    const { info, amount, range, algorithm, singleSided } =
      context.session.createPosition;
    context.session.openPosition = {};
    context.session.createPosition = { range: [0.15, 0.15] };

    if (info && amount && range && algorithm) {
      const name = format("%/%", info.mintA.symbol, info.mintB.symbol);

      const [
        [, , signature],
        nftMint,
        {
          solAmountIn,
          upperTick,
          lowerTick,
          liquidity,
          baseAmount,
          quoteAmount,
        },
      ] = await createPosition(context.raydium, {
        range,
        rangeBias: 2,
        slippage: Number(context.user.settings.slippage),
        input: {
          amount,
          mint: "So11111111111111111111111111111111111111112",
        },
        poolId: info.id,
      });

      let amountA: number = 0;
      let amountB: number = 0;

      if (singleSided) {
        if (singleSided === "MintA")
          amountA = new Decimal(baseAmount.toString())
            .div(Math.pow(10, info.mintA.decimals))
            .toNumber();
        else
          amountB = new Decimal(baseAmount.toString())
            .div(Math.pow(10, info.mintB.decimals))
            .toNumber();
      } else {
        amountA = new Decimal(baseAmount.toString())
          .div(Math.pow(10, info.mintA.decimals))
          .toNumber();
        if (quoteAmount)
          amountB = new Decimal(quoteAmount.toString())
            .div(Math.pow(10, info.mintB.decimals))
            .toNumber();
      }

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
          stopLossPercentage: undefined,
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
  })
);
