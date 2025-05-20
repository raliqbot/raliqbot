import { format } from "@raliqbot/shared";
import { Context, Markup } from "telegraf";

import { readFileSync } from "../../utils";

export const editRange = async (
  context: Context,
  next: () => Promise<unknown>
) => {
  if (context.callbackQuery && "data" in context.callbackQuery) {
    const data = context.callbackQuery.data;
    const percentages = [
      10,
      ...Array.from({ length: 4 }).map((_, index) => (index + 1) * 25),
    ];

    if (data === "edit-range") {
      const message = await context.replyWithMarkdownV2(
        readFileSync("locale/en/create-position/edit-range.md", "utf-8"),
        context.session.createPosition.algorithm === "single-sided"
          ? Markup.inlineKeyboard([
              percentages.map((percentage) =>
                Markup.button.callback(
                  `${percentage}%`,
                  format("percentage-%", percentage)
                )
              ),
            ])
          : Markup.forceReply()
      );

      context.session.messageIdsStack.push(message.message_id);

      return next();
    }
  }
};
