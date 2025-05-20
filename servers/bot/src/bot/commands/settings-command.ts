import moment from "moment";
import { Markup, type Context, type Telegraf } from "telegraf";

import {
  catchBotRuntimeError,
  cleanText,
  privateFunc,
  readFileSync,
} from "../utils";

export const onSettings = (editMessageId?: number) =>
  privateFunc(
    catchBotRuntimeError(async (context: Context) => {
      const { settings } = context.user;
      const message = readFileSync("locale/en/settings/config.md", "utf-8")
        .replace(
          "%vault_address%",
          settings.vaultAddress ? cleanText(settings.vaultAddress) : "Not set"
        )
        .replace("%priority_fee%", cleanText(String(settings.priorityFees)))
        .replace(
          "%slippage%",
          cleanText(String(Number(settings.slippage) * 100))
        )
        .replace("%language%", settings.locale)
        .replace(
          "%rebalancing_schedule%",
          cleanText(moment.duration(settings.rebalanceSchedule).humanize())
        );

      const markup = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🔐 Change Vault Address",
            "change-vault-address"
          ),
        ],
        [Markup.button.callback("％ Change Slippage", "change-slippage")],
        [
          Markup.button.callback(
            "💶 Change Priority Fees",
            "change-priority-fees"
          ),
        ],
        [Markup.button.callback("🌎 Change Bot Language", "change-locale")],
      ]);

      const messageId = await (editMessageId
        ? context.telegram.editMessageText(
            context.chat!.id,
            editMessageId,
            undefined,
            message,
            { reply_markup: markup.reply_markup, parse_mode: "MarkdownV2" }
          )
        : context.replyWithMarkdownV2(message, markup));

      context.session.messageId =
        typeof messageId === "boolean" ? undefined : messageId.message_id;
    }, true)
  );

export const settingsCommand = (telegraf: Telegraf) => {
  telegraf.settings(onSettings());
  telegraf.action("settings", onSettings());
};

settingsCommand.commandName = "settings";
settingsCommand.help = "Get and manage bot settings.";
