import { session, type Telegraf } from "telegraf";

import registerScenes from "./scenes";
import registerActions from "./actions";
import registerCommands from "./commands";
import { authUser, initializeSession } from "./middlewares";
import {
  startCommand,
  pnlCommand,
  createPositionCommand,
  addLiquidityCommand,
  removeLiquidityCommand,
  closePositionCommand,
} from "./commands";

export default function registerBot(bot: Telegraf) {
  bot.use(session());
  bot.use(authUser);
  bot.use(initializeSession);

  registerScenes(bot);
  registerActions(bot);
  registerCommands(bot);

  bot.telegram.setMyCommands([
    startCommand,
    pnlCommand,
    createPositionCommand,
    addLiquidityCommand,
    removeLiquidityCommand,
    closePositionCommand,
  ]);
}
