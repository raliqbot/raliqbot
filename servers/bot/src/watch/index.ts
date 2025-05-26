import { nodeCron, type ScheduledTask } from "node-cron";
import { web3 } from "@coral-xyz/anchor";

import { getEnv } from "../core";
import { bot, db, dexscreemer } from "../instances";
/// this is important
import { positionChecks } from "./position-check";

export const main = async () => {
  const tasks: ScheduledTask[] = [];

  const positionChecksTask = nodeCron.schedule("*/5 * * * *", async () => {
    await positionChecks(
      db,
      bot,
      dexscreemer,
      new web3.Connection(getEnv("RPC_URL"))
    ).catch((error) => console.error(error));
  });

  tasks.push(positionChecksTask);

  const close = () => Promise.all(tasks.map((task) => task.stop()));

  process.once("SIGINT", close);
  process.once("SIGTERM", close);
};

main().then(() => console.log("[worker.started] worker running in background"));

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
