import { Telegraf } from "telegraf";
import { walletAction } from "./wallet-action";
import { settingsAction } from "./settings-action";
import { onPoolSearchAction } from "./on-pool-search-action";
import { createPositionAction } from "./create-position-action";

export const registerActions = (telegraf: Telegraf) => {
  telegraf.on("inline_query", onPoolSearchAction);

  walletAction(telegraf);
  settingsAction(telegraf);
  createPositionAction(telegraf);
};

export default registerActions;
