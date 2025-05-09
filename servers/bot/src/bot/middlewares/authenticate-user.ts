import type { Context } from "telegraf";
import { Raydium } from "@raydium-io/raydium-sdk-v2";

import { db, connection } from "../../instances";
import { createUser } from "../../controllers/users.controller";
import { loadWallet } from "../../controllers/wallets.controller";

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
      disableLoadToken: true,
    });
    if (!context.session) context.session = {} as any;
    if (!context.session.searchCache) context.session.searchCache = {};
    if (!context.session.closePosition) context.session.closePosition = {};
    if (!context.session.createPosition)
      context.session.createPosition = { range: [0.15, 0.15] };
    if (!context.session.messageIdsStack) context.session.messageIdsStack = [];
    return next();
  }
};
