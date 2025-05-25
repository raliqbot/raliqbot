import { format } from "@raliqbot/shared";
import { Markup, WizardContext } from "telegraf";

import { readFileSync } from "../../utils";

export const editRange = async (
  context: WizardContext,
  next?: () => Promise<unknown>
) => {
  if (context.callbackQuery && "data" in context.callbackQuery) {
    const percentages = [
      10,
      ...Array.from({ length: 4 }).map((_, index) => (index + 1) * 25),
    ];

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
    if (next) return next();
  }
};
