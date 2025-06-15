import { Markup, type Telegraf } from "telegraf";
import { message } from "telegraf/filters";

import { meteora } from "../../instances";

export const messageAction = (bot: Telegraf) => {
  bot.on(message("text"), async (context, next) => {
    const text = context.message.text;
    if (/^\//.test(text)) return next();

    const pairs = await meteora.pair.allWithPagination({
      search_term: text,
    });

    if (pairs.total > 0) {
      return context.editMessageText(
        "",
        Markup.inlineKeyboard([
          [
            Markup.button.callback("⏪ Previous", "previous"),
            Markup.button.callback("⏩ Next", "next"),
          ],
          [Markup.button.callback("🛠️ Main Menu", "mainmenu")],
        ])
      );
    }
  });
};
