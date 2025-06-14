import type { Context, Telegraf } from "telegraf";
import { createPositionSceneId } from "../scenes/create-position-scene";

export const createPositionCommand = (bot: Telegraf) => {
  const onCreatePositionCommand = (context: Context) => {
    const text =
      context.callbackQuery && "data" in context.callbackQuery
        ? context.callbackQuery.data
        : context.message && "text" in context.message
        ? context.message.text
        : undefined;

    if (text) {
      const [, pair, amount, strategy] = text.split(/\s/g);
      return context.scene.enter(createPositionSceneId);
    }
  };

  const commandFilter = /createPosition/;

  bot.action(commandFilter, onCreatePositionCommand);
  bot.command(commandFilter, onCreatePositionCommand);
};

createPositionCommand.command = "createPosition";
createPositionCommand.description =
  "Create new position for a pool. /help createPosition for detailed help.";
