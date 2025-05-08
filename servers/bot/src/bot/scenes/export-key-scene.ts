import { Composer, Context, Markup, Scenes } from "telegraf";

import { readFileSync } from "../utils";

export const exportKeySceneId = "export-key-scene-id";

const exportKeyComposer = new Composer();

exportKeyComposer.action("accept", async (context: Context) => {
  await context.replyWithMarkdownV2(
    readFileSync("locale/en/wallet/export-key.md", "utf8").replace(
      "%key%",
      context.wallet.secretKey.toBase64()
    )
  );

  return context.scene.leave();
});
exportKeyComposer.action("cancel", (context: Context) =>
  context.deleteMessage()
);

export const exportKeyScene = new Scenes.WizardScene(
  exportKeySceneId,
  async (context) => {
    await context.replyWithMarkdownV2(
      readFileSync("locale/en/wallet/export-key-confirmation.md", "utf8"),
      Markup.inlineKeyboard([
        [Markup.button.callback("✅ I understand, proceed", "accept")],
        [Markup.button.callback("🅇 Cancel", "cancel")],
      ])
    );
    return context.wizard.next();
  },
  exportKeyComposer
);
