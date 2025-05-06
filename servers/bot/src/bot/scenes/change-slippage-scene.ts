import { Markup, Scenes } from "telegraf";

import { db } from "../../instances";
import { readFileSync } from "../utils";
import { onSettings } from "../commands/settings-command";
import { updateSettingsByUser } from "../../controllers/settings.controller";

export const changeSlippageSceneId = "change-slippage-scene";

export const changeSlippageScene = new Scenes.WizardScene(
  changeSlippageSceneId,
  async (context) => {
    await context.replyWithMarkdownV2(
      readFileSync("locale/en/settings/change-slippage.md", "utf-8"),
      Markup.forceReply()
    );

    return context.wizard.next();
  },
  async (context) => {
    const message = context.message;
    if (message && "text" in message) {
      const slippage = Number(message.text.replace(/\s/g, ""));
      if (Number.isNaN(slippage)) return context.scene.leave();

      const [settings] = await updateSettingsByUser(db, context.user.id, {
        slippage: String(slippage > 1 ? slippage / 100 : slippage),
      });
      context.user.settings = settings;

      if (context.session.messageId) await onSettings(context.session.messageId)(context);

      return context.scene.leave();
    }
  }
);
