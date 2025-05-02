import type { Telegraf } from "telegraf";

export const createPositionCommand = (telegraf: Telegraf) => {
  telegraf.action("create-position", (context) => {});
};
