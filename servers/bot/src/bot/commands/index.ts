import type { Telegraf } from "telegraf";

import { helpCommand } from "./help-command";
import { startCommand } from "./start-command";
import { walletCommand } from "./wallet-command";
import { settingsCommand } from "./settings-command";
import { portfolioCommand } from "./portfolio-command";
import { claimRewardCommand } from "./claim-reward-command";
import { openPositionCommand } from "./open-position-command";
import { closePositionCommand } from "./close-position-command";

export const registerCommands = async (telegraf: Telegraf) => {
  helpCommand(telegraf);
  startCommand(telegraf);
  walletCommand(telegraf);
  settingsCommand(telegraf);
  portfolioCommand(telegraf);
  claimRewardCommand(telegraf);
  openPositionCommand(telegraf);
  closePositionCommand(telegraf);
};

export default registerCommands;
