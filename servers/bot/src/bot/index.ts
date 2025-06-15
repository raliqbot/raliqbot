import { session, type Telegraf } from "telegraf";

import registerScenes from "./scenes";
import registerActions from "./actions";
import registerCommands from "./commands";
import { authUser, initializeI8n, initializeSession } from "./middlewares";
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
  bot.use(initializeI8n);
  bot.use(initializeSession);

  registerScenes(bot);
  registerActions(bot);
  registerCommands(bot);

  // bot.telegram.setMyCommands([
  //   startCommand.config,
  //   pnlCommand.config,
  //   createPositionCommand.config,
  //   addLiquidityCommand.config,
  //   removeLiquidityCommand.config,
  //   closePositionCommand.config,
  // ]);
}
