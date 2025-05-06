import { importKeyScene } from "./import-key-scene";
import { exportKeyScene } from "./export-key-scene";
import { changeVaultScene } from "./change-vault-scene";
import { changeLocaleScene } from "./change-locale.scene";
import { openPositionScene } from "./open-position-scene";
import { changeSlippageScene } from "./change-slippage-scene";
import { createPositionScene } from "./create-position-scene";
import { changeRescheduleScene } from "./change-reschedule-scene";
import { changePriorityFeesScene } from "./change-priority-fees-scene";

export const scenes = [
  changePriorityFeesScene,
  changeRescheduleScene,
  changeSlippageScene,
  changeVaultScene,
  createPositionScene,
  exportKeyScene,
  importKeyScene,
  openPositionScene,
  changeLocaleScene,
];
