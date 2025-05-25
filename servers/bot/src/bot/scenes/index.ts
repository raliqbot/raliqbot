import { importKeyScene } from "./import-key-scene";
import { exportKeyScene } from "./export-key-scene";
import { changeVaultScene } from "./change-vault-scene";
import { changeLocaleScene } from "./change-locale.scene";
import { openPositionScene } from "./open-position-scene";
import { changeSlippageScene } from "./change-slippage-scene";
import { changeRescheduleScene } from "./change-reschedule-scene";
import { changePriorityFeesScene } from "./change-priority-fees-scene";
import {
  createSingleSidedPositionScene,
  createSpotPositionScene,
} from "./create-position-scene";

export const scenes = [
  exportKeyScene,
  importKeyScene,
  changeVaultScene,
  openPositionScene,
  changeLocaleScene,
  changeSlippageScene,
  changeRescheduleScene,
  changePriorityFeesScene,
  createSpotPositionScene,
  createSingleSidedPositionScene,
];
