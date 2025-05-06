import { Markup, Scenes } from "telegraf";

import { db } from "../../instances";
import { readFileSync } from "../utils";
import { onSettings } from "../commands/settings-command";
import { updateSettingsByUser } from "../../controllers/settings.controller";

export const changePriorityFeesSceneId = "change-priority-fees-scene";

export const changePriorityFeesScene = new Scenes.WizardScene(
  changePriorityFeesSceneId,
  async (context) => {
    await context.replyWithMarkdownV2(
      readFileSync("locale/en/settings/change-priority-fees.md", "utf-8"),
      Markup.forceReply()
    );

    return context.wizard.next();
  },
  async (context) => {
    const message = context.message;
    if (message && "text" in message) {
      const priorityFees = Number(message.text.replace(/\s/g, ""));
      if (Number.isNaN(priorityFees)) return context.scene.leave();

      const [settings] = await updateSettingsByUser(db, context.user.id, {
        priorityFees: String(priorityFees),
      });

      context.user.settings = settings;
      if (context.session.messageId)
        await onSettings(context.session.messageId)(context);

      return context.scene.leave();
    }
  }
);
