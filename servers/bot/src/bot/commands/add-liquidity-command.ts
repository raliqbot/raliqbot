import type { Context, Telegraf } from "telegraf";

export const addLiquidityCommand = (bot: Telegraf) => {
  const onAddLiquidityCommand = (context: Context) => {
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

  const commandFilter = /addLiquidity/;

  bot.action(commandFilter, onAddLiquidityCommand);
  bot.command(commandFilter, onAddLiquidityCommand);
};

addLiquidityCommand.command = "addLiquidity";
addLiquidityCommand.description=
  "Increase liquidity for a single position or multiple positions. /help addLiquidity for detailed help.";
