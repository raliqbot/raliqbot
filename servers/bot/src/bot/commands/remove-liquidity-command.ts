import type { Context, Telegraf } from "telegraf";

export const removeLiquidityCommand = (bot: Telegraf) => {
  const onRemoveLiquidityCommand = (context: Context) => {
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

  const commandFilter = /removeLiquidity/;

  bot.action(commandFilter, onRemoveLiquidityCommand);
  bot.command(commandFilter, onRemoveLiquidityCommand);
};

removeLiquidityCommand.config = {
  command: "removeLiquiditys",
  description:
    "Decrease liquidity for a single position or multiple positions. /help removeLiquidity for detailed help.",
};
