import type { Context, Telegraf } from "telegraf";

import { readFileSync } from "../utils";

export const helpCommand = (telegraf: Telegraf) => {
  const onHelp = (context: Context) => {
    return context.replyWithMarkdownV2(
      readFileSync("locale/en/help.md", "utf-8")
    );
  };

  telegraf.help(onHelp);
  telegraf.action("help", onHelp);
};

helpCommand.commandName = "help";
helpCommand.help = "Bot FAQ and detailed instructions.";
