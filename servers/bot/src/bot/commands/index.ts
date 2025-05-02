import type { Telegraf } from "telegraf";

import { startCommand } from "./start-command";
import { closePositionCommand } from "./close-position-command";
import { createPositionCommand } from "./create-position-command";

export const registerCommands = async (telegraf: Telegraf) => {
  startCommand(telegraf);
  closePositionCommand(telegraf);
  createPositionCommand(telegraf);
};

export default registerCommands;
