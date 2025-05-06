import { Composer, Markup, Scenes } from "telegraf";

import { db } from "../../instances";
import { readFileSync } from "../utils";
import { onSettings } from "../commands/settings-command";
import { updateSettingsByUser } from "../../controllers/settings.controller";

export const changeLocaleSceneId = "change-locale-scene";

const composer = new Composer();
composer.on("callback_query", async (context) => {
  const locale =
    context.callbackQuery && "data" in context.callbackQuery
      ? context.callbackQuery.data
      : undefined;
  if (locale && context.user.settings.locale !== locale) {
    const [settings] = await updateSettingsByUser(db, context.user.id, {
      locale,
    });
    context.user.settings = settings;
    if (context.session.messageId)
      return onSettings(context.session.messageId)(context);
  }
});

export const changeLocaleScene = new Scenes.WizardScene(
  changeLocaleSceneId,
  async (context) => {
    await context.replyWithMarkdownV2(
      readFileSync("locale/en/settings/change-locale.md", "utf-8"),
      Markup.inlineKeyboard([[Markup.button.callback("🇺🇸 English", "en")]])
    );

    return context.wizard.next();
  },
  composer
);
