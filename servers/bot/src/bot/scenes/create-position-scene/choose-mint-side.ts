import { Context, Markup, Scenes } from "telegraf";

import { readFileSync } from "../../utils";

export const chooseMintSide = async (
  context: Context & { wizard: Scenes.WizardContext["wizard"] },
  next: () => Promise<unknown>
) => {
  const { info } = context.session.createPosition;
  const message = await context.replyWithMarkdownV2(
    readFileSync("locale/en/create-position/select-token-side.md", "utf-8"),
    Markup.inlineKeyboard([
      (
        [
          ["MintA", info!.mintA],
          ["MintB", info!.mintB],
        ] as const
      ).map(([mintSide, mint]) =>
        Markup.button.callback(mint.symbol, mintSide)
      ),
      [Markup.button.callback("🅇 Cancel", "cancel")],
    ])
  );

  context.session.messageIdsStack.push(message.message_id);

  await context.wizard.next();
  return next();
};
