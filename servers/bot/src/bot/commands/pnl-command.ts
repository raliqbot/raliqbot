import type { Context, Telegraf } from "telegraf";

export const pnlCommand = (bot: Telegraf) => {
  const onPnlCommand = (context: Context) => {
    const text =
      context.callbackQuery && "data" in context.callbackQuery
        ? context.callbackQuery.data
        : context.message && "text" in context.message
        ? context.message.text
        : undefined;

    if (text) {
      const [, ...positions] = text.split(/\s/g);
    }
  };

  const commandFilter = /pnl/;

  bot.action(commandFilter, onPnlCommand);
  bot.command(commandFilter, onPnlCommand);
};

pnlCommand.config = {
  command: "pnl",
  description:
    "pnl for a single position or multiple positions. /help pnl for detailed help.",
};
