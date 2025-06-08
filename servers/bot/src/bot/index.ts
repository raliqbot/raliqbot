import { parse } from "pg-connection-string";
import { Postgres } from "@telegraf/session/pg";
import { Scenes, session, type SessionStore, type Telegraf } from "telegraf";

import { getEnv } from "../core";
import { scenes } from "./scenes";
import registerActions from "./actions";
import { SessionData } from "../global";
import registerCommands from "./commands";
import { authenticateUser } from "./middlewares/authenticate-user";

export default function registerBot(bot: Telegraf) {
  const config = parse(getEnv("DATABASE_URL"));
  const stage = new Scenes.Stage<any>(scenes);
  const store: SessionStore<SessionData> = Postgres({
    user: config.user!,
    host: config.host!,
    password: config.password!,
    database: config.database!,
    config: {
      ssl: config.ssl as boolean,
    },
  });

  scenes.map((scene) => scene.use(authenticateUser));
  bot.use(
    session({
      store,
    })
  );
  bot.use(stage.middleware());
  bot.use(authenticateUser);

  registerActions(bot);
  registerCommands(bot);
}
