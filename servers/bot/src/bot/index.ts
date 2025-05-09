import { Scenes, session, type Telegraf } from "telegraf";

import { scenes } from "./scenes";
import registerActions from "./actions";
import registerCommands from "./commands";
import { authenticateUser } from "./middlewares/authenticate-user";

export default function registerBot(bot: Telegraf) {
  const stage = new Scenes.Stage<any>(scenes);
  scenes.map((scene) => scene.use(authenticateUser));
  bot.use(session());
  bot.use(stage.middleware());
  bot.use(authenticateUser);

  registerActions(bot);
  registerCommands(bot);
}
