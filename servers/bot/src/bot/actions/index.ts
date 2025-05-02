import { Telegraf } from "telegraf";
import { onPoolSearchAction } from "./on-pool-search-action";

export const registerActions = (telegraf: Telegraf) => {
  telegraf.on("inline_query", onPoolSearchAction);
};

export default registerActions;
