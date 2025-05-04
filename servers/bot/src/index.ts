import { Telegraf } from "telegraf";
import { getEnv } from "./core";
import registerBot from "./bot";

async function main() {
  const bot = new Telegraf(getEnv("TELEGRAM_BOT_API_KEY"));
  registerBot(bot);

  bot.launch();

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
