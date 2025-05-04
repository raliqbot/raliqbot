import moment from "moment";
import { Markup, type Context, type Telegraf } from "telegraf";

import { cleanText, readFileSync } from "../utils";

export const settingsCommand = (telegraf: Telegraf) => {
  const onSettings = (context: Context) => {
    const { settings } = context.user;

    return context.replyWithMarkdownV2(
      readFileSync("locale/en/settings/config.md", "utf-8")
        .replace(
          "%vault_address%",
          settings.vaultAddress ? cleanText(settings.vaultAddress) : "Not set"
        )
        .replace("%priority_fee%", cleanText(String(settings.priorityFees)))
        .replace(
          "%rebalancing_schedule%",
          cleanText(moment.duration(settings.rebalanceSchedule).humanize())
        ),
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🔐 Change Vault Address",
            "change-vault-address"
          ),
        ],
        [
          Markup.button.callback(
            "💶 Change Priority Fees",
            "change-priority-fees"
          ),
        ],
        [
          Markup.button.callback(
            "🕟 Change Rebalancing Schedule",
            "change-rebalancing-schedule"
          ),
        ],
      ])
    );
  };

  telegraf.settings(onSettings);
  telegraf.action("settings", onSettings);
};
