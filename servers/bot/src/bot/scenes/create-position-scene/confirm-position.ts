import { format } from "@raliqbot/shared";
import { readFileSync, cleanText } from "bot/utils";
import { Context, Markup, Scenes } from "telegraf";

export const confirmPosition = async (
  context: Context,
  next: () => Promise<unknown>
) => {
  const { info, messageId, amount, range } = context.session.createPosition;

  if (info && amount) {
    const [tickLower, tickUpper] = range.map((range) => range * 100);

    const message = readFileSync(
      "locale/en/create-position/position-config.md",
      "utf-8"
    )
      .replace(
        "%name%",
        cleanText(format("%/%", info.mintA.symbol, info.mintB.symbol)).replace(
          /\s/g,
          ""
        )
      )
      .replace(
        "%range%",
        `-${tickLower.toFixed(2)}%, +${tickUpper.toFixed(2)}%`
      )
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
    context.session.messageIdsStack.push(message_id);

    return next();
  }
};
