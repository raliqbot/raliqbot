import { Telegraf } from "telegraf";

import { changeLocaleSceneId } from "../scenes/change-locale.scene";
import { changeVaultSceneId } from "../scenes/change-vault-scene";
import { changeSlippageSceneId } from "../scenes/change-slippage-scene";
import { changeRescheduleSceneId } from "../scenes/change-reschedule-scene";
import { changePriorityFeesSceneId } from "../scenes/change-priority-fees-scene";

export const settingsAction = (telegraf: Telegraf) => {
  telegraf.action(
    /change-priority-fees|change-slippage|change-vault-address|change-rescheduling-schedule|change-locale/,
    (context) => {
      const callback = context.callbackQuery;
      if (callback && "data" in callback) {
        context.session.messageId = context.msgId;
        switch (callback.data) {
          case "change-priority-fees":
            return context.scene.enter(changePriorityFeesSceneId);
          case "change-slippage":
            return context.scene.enter(changeSlippageSceneId);
          case "change-vault-address":
            return context.scene.enter(changeVaultSceneId);
          case "change-rescheduling-schedule":
            return context.scene.enter(changeRescheduleSceneId);
          case "change-locale":
            return context.scene.enter(changeLocaleSceneId);
        }
      }
    }
  );
};
