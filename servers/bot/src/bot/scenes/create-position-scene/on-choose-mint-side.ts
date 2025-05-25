import { Context, Scenes } from "telegraf";

export const onChooseMintSide = async (
  context: Context & { wizard: Scenes.WizardContext["wizard"] },
  next?: () => Promise<unknown>
) => {
  const data =
    context.callbackQuery && "data" in context.callbackQuery
      ? (context.callbackQuery.data.replace(/\s+/g, String()) as
          | "MintA"
          | "MintB")
      : undefined;

  if (data && ["MintA", "MintB"].includes(data)) {
    context.session.createPosition.singleSided = data;
    if (data === "MintA")
      context.session.createPosition.range = [
        0,
        context.session.createPosition.range[0],
      ];
    else
      context.session.createPosition.range = [
        context.session.createPosition.range[0],
        0,
      ];
    if (next) return next();
  }
};
