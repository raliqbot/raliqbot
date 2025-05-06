import "dotenv/config";
import fastify from "fastify";
import { Telegraf } from "telegraf";

import { getEnv } from "./core";
import registerBot from "./bot";
import { format } from "@raliqbot/shared";

async function main() {
  const bot = new Telegraf(getEnv("TELEGRAM_BOT_API_KEY"));
  registerBot(bot);

  bot.catch((error) => console.error(error));
  if (process.env.DOMAIN) {
    const server = fastify({ logger: true });
    server.post(
      format("/telegraf/%", bot.secretPathComponent()),
      (await bot.createWebhook({ domain: process.env.DOMAIN! })) as any
    );
    server.listen({
      host: process.env.HOST ? process.env.HOST : "0.0.0.0",
      port: process.env.PORT ? Number(process.env.PORT!) : 10004,
    });
  } else bot.launch().then(() => console.log("bot running in background"));

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
  process.on("uncaughtException", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
}

main();
