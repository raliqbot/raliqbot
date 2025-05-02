import { Telegraf } from "telegraf";

export const actionName = "close-position";

export const closePositionCommand = (telegraf: Telegraf) => {
  telegraf.command(actionName, (context) => {
    const [, poolId] = context.message.text.split(/\s/g);
    if (poolId) {
    }

    return context.replyWithMarkdownV2("");
  });
};
