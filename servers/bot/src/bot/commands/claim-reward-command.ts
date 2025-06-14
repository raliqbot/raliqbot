import { Context, Telegraf } from "telegraf";

export const claimRewardCommand = (bot: Telegraf) => {
  const onClaimRewardCommand = (context: Context) => {
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

  const commandFilter = /claimReward/;

  bot.action(commandFilter, onClaimRewardCommand);
  bot.command(commandFilter, onClaimRewardCommand);
};

claimRewardCommand.command = "claimReward";
claimRewardCommand.description =
  "Claim rewards for a single position or multiple positions. /help claimReward for detailed help.";
