import { Context, Telegraf } from "telegraf";

export const startCommand = (botInstance: Telegraf) => {
  const onStart = (context: Context) => {};

  botInstance.start(onStart);
  botInstance.action("mainmenu", onStart);
};

startCommand.command = "mainmenu";
startCommand.description = "update bot to latest version.";
