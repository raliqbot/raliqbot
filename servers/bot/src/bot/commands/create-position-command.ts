import { isNumber } from "lodash";
import { is_valid_address } from "@raliqbot/lib";
import type { Context, Telegraf } from "telegraf";

import { Strategies, Strategy } from "../../utils";
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
      const [, poolId, amount, strategy] = text.split(/\s/g);
      if (poolId && is_valid_address(poolId))
        context.session.createPosition.poolId = poolId;
      if (amount && isNumber(parseFloat(amount)))
        context.session.createPosition.amount = parseFloat(amount);
      if (strategy && strategy in Strategies)
        context.session.createPosition.strategy =
          Strategy[strategy as keyof typeof Strategy];
      if (poolId) return context.scene.enter(createPositionSceneId);
    }
  };

  const commandFilter = /createPosition/;

  bot.action(commandFilter, onCreatePositionCommand);
  bot.command(commandFilter, onCreatePositionCommand);
};

createPositionCommand.command = "createPosition";
createPositionCommand.description =
  "Create new position for a pool. /help createPosition for detailed help.";
