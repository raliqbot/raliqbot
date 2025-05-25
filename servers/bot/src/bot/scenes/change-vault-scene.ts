import { Markup, Scenes } from "telegraf";
import { isValidAddress } from "@raliqbot/lib";


import { db } from "../../instances";
import { readFileSync } from "../utils";
import { onSettings } from "../commands/settings-command";
import { updateSettingsByUser } from "../../controllers/settings.controller";

export const changeVaultSceneId = "change-vault-scene";

export const changeVaultScene = new Scenes.WizardScene(
  changeVaultSceneId,
  async (context) => {
    await context.replyWithMarkdownV2(
      readFileSync("locale/en/settings/change-vault-address.md", "utf-8"),
      Markup.forceReply()
    );

    return context.wizard.next();
  },
  async (context) => {
    const message = context.message;
    if (message && "text" in message) {
      const vaultAddress = message.text.replace(/\s/g, "");

      if (isValidAddress(vaultAddress)) {
        const [settings] = await updateSettingsByUser(db, context.user.id, {
          vaultAddress,
        });
        context.user.settings = settings;

        if (context.session.messageId)
          await onSettings(context.session.messageId)(context);
      }

      await context.replyWithMarkdownV2(
        readFileSync("locale/en/settings/update-successful.md", "utf-8")
      );

      return context.scene.leave();
    }
  }
);

