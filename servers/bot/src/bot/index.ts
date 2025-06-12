import { session, type Telegraf } from "telegraf";

import registerScenes from "./scenes";
import registerActions from "./actions";
import { authUser } from "./middlewares";
import registerCommands from "./commands";

export default function registerBot(bot: Telegraf) {
  bot.use(session());
  bot.use(authUser);

  registerScenes(bot);
  registerActions(bot);
  registerCommands(bot);
}
