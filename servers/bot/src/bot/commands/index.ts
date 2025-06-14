import type { Telegraf } from "telegraf";

import { pnlCommand } from "./pnl-command";
import { startCommand } from "./start-command";
import { addLiquidityCommand } from "./add-liquidity-command";
import { closePositionCommand } from "./close-position-command";
import { createPositionCommand } from "./create-position-command";
import { removeLiquidityCommand } from "./remove-liquidity-command";

export default function registerCommands(bot: Telegraf) {
  pnlCommand(bot);
  startCommand(bot);
  addLiquidityCommand(bot);
  closePositionCommand(bot);
  createPositionCommand(bot);
  removeLiquidityCommand(bot);
}

export { pnlCommand } from "./pnl-command";
export { startCommand } from "./start-command";
export { addLiquidityCommand } from "./add-liquidity-command";
export { closePositionCommand } from "./close-position-command";
export { createPositionCommand } from "./create-position-command";
export { removeLiquidityCommand } from "./remove-liquidity-command";
