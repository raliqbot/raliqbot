import "dotenv/config";
import { Telegraf } from "telegraf";
import { format } from "@raliqbot/shared";
import fastify, { type FastifyInstance } from "fastify";

import registerBot from "./bot";
import { bot } from "./instances";
import registerRoutes from "./routes";

async function main(server: FastifyInstance, bot: Telegraf) {
  registerBot(bot);
  registerRoutes(server);

  const promises = [];

  promises.push(
    server.listen({
      host: process.env.HOST ? process.env.HOST : "0.0.0.0",
      port: process.env.PORT ? Number(process.env.PORT!) : 10004,
    })
  );

  bot.catch((error) => console.error(error));
  if (process.env.DOMAIN) {
    server.post(
      format("/telegraf/%", bot.secretPathComponent()),
      (await bot.createWebhook({ domain: process.env.DOMAIN! })) as any
    );
  } else
    promises.push(
      bot.launch().then(() => console.log("bot running in background"))
    );

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
  process.on("uncaughtException", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });

  return Promise.all(promises);
}

const server = fastify({ logger: true, ignoreTrailingSlash: true });

main(server, bot);
