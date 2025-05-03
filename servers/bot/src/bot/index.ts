import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { Scenes, session, type Context, type Telegraf } from "telegraf";

import registerActions from "./actions";
import registerCommands from "./commands";
import { connection, db } from "../instances";
import { createUser } from "../controllers/users.controller";
import { loadWallet } from "../controllers/wallets.controller";
import { createPositionScene } from "./scenes/create-position-scene";

export const authenticateUser = async (
  context: Context,
  next: () => Promise<void>
) => {
  const user = context.from;
  if (user) {
    const dbUser = await createUser(db, {
      id: String(user.id),
      lastLogin: new Date(),
    });

    const owner = loadWallet(dbUser.wallet);

    context.user = dbUser;
    context.wallet = owner;
    context.raydium = await Raydium.load({
      owner,
      connection,
      cluster: "mainnet",
    });
    context.session = { createPosition: {} };
    return next();
  }
};

export default function registerBot(bot: Telegraf) {
  const scenes = [createPositionScene];
  const stage = new Scenes.Stage<any>([createPositionScene]);
  scenes.map((scene) => scene.use(authenticateUser));
  bot.use(session());
  bot.use(stage.middleware());
  bot.use(authenticateUser);

  registerActions(bot);
  registerCommands(bot);
}
