import { Context, Markup, Scenes } from "telegraf";

import { onInputAmount } from "./on-input-amount";

export const onChooseMintSide = async (
  context: Context & { wizard: Scenes.WizardContext["wizard"] },
  next: () => Promise<unknown>
) => {
  if (context.session.createPosition.algorithm === "single-sided") {
    const singleSided =
      context.callbackQuery && "data" in context.callbackQuery
        ? (context.callbackQuery.data.replace(/\s+/g, "") as "MintA" | "MintB")
        : undefined;

    if (singleSided && ["MintA", "MintB"].includes(singleSided)) {
      context.session.createPosition.singleSided = singleSided;
      if (singleSided === "MintA")
        context.session.createPosition.range = [
          0,
          context.session.createPosition.range[0],
        ];
      else
        context.session.createPosition.range = [
          context.session.createPosition.range[0],
          0,
        ];

      return next();
    }
  }
};
