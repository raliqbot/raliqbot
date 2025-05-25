import { format } from "@raliqbot/shared";
import { Markup, WizardContext } from "telegraf";

import { readFileSync, cleanText } from "../../utils";

export const confirmPosition = async (
  context: WizardContext,
  next?: () => Promise<unknown>
) => {
  const { info, messageId, amount, range, algorithm } =
    context.session.createPosition;

  if (info && amount && algorithm) {
    const [tickLower, tickUpper] = range.map((range) =>
      (range * 100).toFixed(2)
    );
    const formatedRange = `-${tickLower}%, +${tickUpper}%`;
    const name = format("%/%", info.mintA.symbol, info.mintB.symbol).replace(
      /\s/g,
      String()
    );

    const message = readFileSync(
      "locale/en/create-position/position-config.md",
      "utf-8"
    )
      .replace("%name%", cleanText(name))
      .replace("%range%", formatedRange)
      .replace("%strategy%", cleanText(algorithm))
      .replace("%amount%", cleanText(amount.toFixed(2)))
      .replace("%price%", cleanText(info.price.toFixed(2)));

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

    context.session.messageIdsStack.push(message_id);
    context.session.createPosition.messageId = message_id;

    if (next) return next();
  }
};
