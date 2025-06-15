import i18next from "i18next";
import { format } from "@raliqbot/shared";
import type { Context, MiddlewareFn } from "telegraf";

import { cleanText } from "./utils";
import { connection, db } from "../instances";
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

export const initializeSession = async <T extends Context>(
  ...[context, next]: Parameters<MiddlewareFn<T>>
) => {
  if (!context.connection) context.connection = connection;
  if (!context.session)
    context.session = {
      pools: {},
      createPosition: {},
      messageIdsStack: [],
      cachedPoolWithPositions: {},
    };

  return next();
};

export const initializeI8n = async <T extends Context>(
  ...[context, next]: Parameters<MiddlewareFn<T>>
) => {
  const i18 = i18next.createInstance();
  await i18.init({
    lng: context.user.settings.data.locale,
    debug: true,
    resources: {
      en: {
        translation: {
          start: {
            help_button: "🆘 Help",
            wallet_button: "💳 Wallet",
            settings_button: "⚙️ Settings",
            portfolio_button: "📊 Portfolio",
            search_button: "🔎 Search For Pools",
            refer_friends_button: "🔗 Refer Friends",
          },
          settings: {
            change_vault_address_button: "🔐 Change Vault Address",
            change_slippage_button: "% Change Slippage",
            change_priority_fees_button: "💵 Change Priority",
            change_bot_langauge_button: "🌏 Change Bot Language",
          },
        },
      },
    },
  });

  context.i18 = i18;
  return next();
};
