import type { Context, Telegraf } from "telegraf";
import { searchPairSceneId } from "../scenes/search-pair-scene";

export const searchCommand = (bot: Telegraf) => {
  const onSearch = (context: Context) => context.scene.enter(searchPairSceneId);

  bot.action("search", onSearch);
  bot.command("search", onSearch);
};

searchCommand.config = {
  command: "search",
  description: "search for a pool. /help search for detailed help.",
};
