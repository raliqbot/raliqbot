import { Telegraf } from "telegraf";
import { onPoolSearchAction } from "./on-pool-search-action";
import { createPositionAction } from "./create-position-action";

export const registerActions = (telegraf: Telegraf) => {
  telegraf.on("inline_query", onPoolSearchAction);
  createPositionAction(telegraf);
};

export default registerActions;
