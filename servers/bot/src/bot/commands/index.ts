import type { Telegraf } from "telegraf";

import { helpCommand } from "./help-command";
import { startCommand } from "./start-command";
import { settingsCommand } from "./settings-command";
import { getWalletCommand } from "./get-wallet-command";
import { getTrendingCommand } from "./get-trending-command";
import { getPortfolioCommand } from "./get-portfolio-command";
import { openPositionCommand } from "./open-position-command";
import { closePositionCommand } from "./close-position-command";

export const registerCommands = async (telegraf: Telegraf) => {
  helpCommand(telegraf);
  startCommand(telegraf);
  settingsCommand(telegraf);
  getWalletCommand(telegraf); 
  getTrendingCommand(telegraf);
  openPositionCommand(telegraf);
  getPortfolioCommand(telegraf);
  closePositionCommand(telegraf);
};

export default registerCommands;
