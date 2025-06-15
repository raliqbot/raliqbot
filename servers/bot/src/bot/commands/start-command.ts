import { Context, Markup, Telegraf } from "telegraf";

import { cleanText, readFileSync } from "../utils";

export const startCommand = (botInstance: Telegraf) => {
  const onStart = async (context: Context) => {
    const func = context.callbackQuery
      ? context.editMessageText
      : context.replyWithMarkdownV2;
    const balance = await context.connection.getBalance(
      context.wallet.publicKey
    );

    return func.bind(context)(
      readFileSync(context, "intl/locale/start.md")
        .replace("%address%", cleanText(context.wallet.publicKey.toBase58()))
        .replace("%balance%", cleanText(balance.toLocaleString())),
      {
        parse_mode: "MarkdownV2",
        link_preview_options: {
          is_disabled: true,
        },
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback(
              context.i18.t("start.search_button"),
              "search"
            ),
          ],
          [
            Markup.button.callback(
              context.i18.t("start.settings_button"),
              "settings"
            ),
          ],
          [
            Markup.button.callback(
              context.i18.t("start.portfolio_button"),
              "portfolio"
            ),
            Markup.button.callback(
              context.i18.t("start.wallet_button"),
              "wallet"
            ),
          ],
          [
            Markup.button.callback(context.i18.t("start.help_button"), "help"),
            Markup.button.callback(
              context.i18.t("start.refer_friends_button"),
              "referFriends"
            ),
          ],
        ]).reply_markup,
      }
    );
  };

  botInstance.start(onStart);
  botInstance.action("mainmenu", onStart);
};

startCommand.config = {
  command: "mainmenu",
  description: "update bot to latest version.",
};
