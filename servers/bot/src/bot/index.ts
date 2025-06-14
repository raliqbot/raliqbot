import { session, type Telegraf } from "telegraf";

import registerScenes from "./scenes";
import registerActions from "./actions";
import { authUser } from "./middlewares";
import registerCommands from "./commands";
import * as botCommands from "./commands";

export default function registerBot(bot: Telegraf) {
  bot.use(session());
  bot.use(authUser);

  registerScenes(bot);
  registerActions(bot);
  registerCommands(bot);

  bot.telegram.setMyCommands([
    botCommands.startCommand,
    botCommands.pnlCommand,
    botCommands.createPositionCommand,
    botCommands.addLiquidityCommand,
    botCommands.removeLiquidityCommand,
    botCommands.closePositionCommand,
  ]);
}
