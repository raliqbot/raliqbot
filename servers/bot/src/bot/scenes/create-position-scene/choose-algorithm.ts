import { Context, Markup, Scenes } from "telegraf";

import { readFileSync } from "../../utils";

export const chooseAlgorithm = async (
  context: Context & { wizard: Scenes.WizardContext["wizard"] },
  next: () => Promise<unknown>
) => {
  const message = await context.replyWithMarkdownV2(
    readFileSync("locale/en/create-position/choose-algorithm.md", "utf-8"),
    Markup.inlineKeyboard([
      [
        Markup.button.callback("⚖️ Spot", "spot"),
        Markup.button.callback("🧩 Single Sided", "single-sided"),
      ],
      [Markup.button.callback("🅇 Cancel", "cancel")],
    ])
  );

  context.session.messageIdsStack.push(message.message_id);

  context.wizard.next();
  return next();
};
