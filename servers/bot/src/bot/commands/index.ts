import type { Telegraf } from "telegraf";

import { helpCommand } from "./help-command";
import { startCommand } from "./start-command";
import { settingsCommand } from "./settings-command";
import { WalletCommand } from "./wallet-command";
import { portfolioCommand } from "./portfolio-command";
import { openPositionCommand } from "./open-position-command";
import { closePositionCommand } from "./close-position-command";

export const registerCommands = async (telegraf: Telegraf) => {
  helpCommand(telegraf);
  startCommand(telegraf);
  WalletCommand(telegraf);
  settingsCommand(telegraf);
  openPositionCommand(telegraf);
  portfolioCommand(telegraf);
  closePositionCommand(telegraf);
};

export default registerCommands;
