import { format } from "@raliqbot/shared";
import type { Context, MiddlewareFn } from "telegraf";

import { db } from "../instances";
import { cleanText } from "./utils";
import { createUser } from "../controllers/users.controller";
import { loadWallet } from "../controllers/wallets.controller";

export const authUser = async <T extends Context>(
  ...[context, next]: Parameters<MiddlewareFn<T>>
) => {
  if (context.user) return next();
  else if (context.from) {
    const user = await createUser(db, {
      id: String(context.from.id),
      name: cleanText(
        format("% %", context.from.first_name, context.from.last_name)
      ),
    });

    context.user = user;
    context.wallet = loadWallet(user.wallet);

    return next();
  }

  return context.reply(
    "You can't access @raliqbot. Contact @onisaibogu for more inforrmation."
  );
};
