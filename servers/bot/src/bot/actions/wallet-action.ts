import { Telegraf } from "telegraf";

import { exportKeySceneId } from "../scenes/export-key-scene";
import { importKeySceneId } from "../scenes/import-key-scene";

export const walletAction = (telegraf: Telegraf) => {
  telegraf.action(/export-key|import-key/, (context) => {
    const callback = context.callbackQuery;
    if (callback && "data" in callback) {
      switch (callback.data) {
        case "export-key":
          return context.scene.enter(exportKeySceneId);
        case "import-key":
          return context.scene.enter(importKeySceneId);
      }
    }
  });
};
