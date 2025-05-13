import { Context, Markup, Scenes } from "telegraf";

import { readFileSync } from "../../utils";

export const editRange = async (
  context: Context,
  next: () => Promise<unknown>
) => {
  if (context.callbackQuery && "data" in context.callbackQuery) {
    const data = context.callbackQuery.data;

    if (data === "edit-range") {
      const message = await context.replyWithMarkdownV2(
        readFileSync("locale/en/create-position/edit-range.md", "utf-8"),
        Markup.forceReply()
      );

      context.session.messageIdsStack.push(message.message_id);

      return next();
    }
  }
};
