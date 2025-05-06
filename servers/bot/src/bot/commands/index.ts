import type { Telegraf } from "telegraf";

import { helpCommand } from "./help-command";
import { startCommand } from "./start-command";
import { settingsCommand } from "./settings-command";
import { getWalletCommand } from "./get-wallet-command";
import { getTrendingCommand } from "./get-trending-command";
import { getPortfolioCommand } from "./get-portfolio-command";
import { closePositionCommand } from "./close-position-command";
import { openPositionCommand } from "./open-position-command";

export const registerCommands = async (telegraf: Telegraf) => {
  startCommand(telegraf);
  helpCommand(telegraf);
  settingsCommand(telegraf);
  getTrendingCommand(telegraf);
  getWalletCommand(telegraf);
  getPortfolioCommand(telegraf);
  closePositionCommand(telegraf);
  openPositionCommand(telegraf);
};

export default registerCommands;
