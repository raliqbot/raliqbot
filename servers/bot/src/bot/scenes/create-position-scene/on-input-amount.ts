import { Context, Scenes } from "telegraf";

export const onInputAmount = async (
  context: Context & { wizard: Scenes.WizardContext["wizard"] },
  next?: () => Promise<unknown>
) => {
  const text =
    context.message && "text" in context.message
      ? context.message.text
      : undefined;

  if (text) {
    const amount = parseFloat(text);
    if (Number.isNaN(amount))
      return context.replyWithMarkdownV2("Invalid amount.");

    context.session.createPosition.amount = amount;
    if (next) return next();
  }
};
