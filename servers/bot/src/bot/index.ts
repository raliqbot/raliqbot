import type { Context, Telegraf } from "telegraf";

import { db } from "../instances";
import registerActions from "./actions";
import registerCommands from "./commands";
import { createUser } from "../controllers/users.controller";
import { loadWallet } from "../controllers/wallets.controller";

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


    context.user = dbUser;
    context.wallet = loadWallet(dbUser.wallet);
    return next();
  }
};

export default function registerBot(bot: Telegraf) {
  bot.use(authenticateUser);

  registerActions(bot);
  registerCommands(bot);
}
