import { Context, Telegraf } from "telegraf";

export const closePositionCommand = (bot: Telegraf) => {
  const onClosePositionCommand = (context: Context) => {
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

  const commandFilter = /closePosition/;

  bot.action(commandFilter, onClosePositionCommand);
  bot.command(commandFilter, onClosePositionCommand);
};

closePositionCommand.command = "closePosition";
closePositionCommand.description =
  "Close a single position or multiple positions. /help closePosition for detailed help.";
