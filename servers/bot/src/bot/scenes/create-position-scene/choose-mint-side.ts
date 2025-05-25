import { Markup, type WizardContext } from "telegraf";

import { readFileSync } from "../../utils";

export const chooseMintSide = async (
  context: WizardContext,
  next?: () => Promise<unknown>
) => {
  const { info } = context.session.createPosition;
  if (info) {
    const sides = [
      ["MintA", info.mintA],
      ["MintB", info.mintB],
    ] as const;

    const message = await context.replyWithMarkdownV2(
      readFileSync("locale/en/create-position/select-token-side.md", "utf-8"),
      Markup.inlineKeyboard([
        sides.map(([side, mint]) => Markup.button.callback(mint.symbol, side)),
        [Markup.button.callback("🅇 Cancel", "cancel")],
      ])
    );

    context.session.messageIdsStack.push(message.message_id);

    if (next) await next();
  }
};
