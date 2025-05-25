import { Context, Markup, Scenes } from "telegraf";

export const inputAmount = async (
  context: Context & { wizard: Scenes.WizardContext["wizard"] },
  next?: () => Promise<unknown>
) => {
  if (context.session.createPosition.amount) return context.wizard.next();

  const message = await context.replyWithMarkdownV2(
    "Enter amount of SOL you want to use to create this LP position",
    Markup.forceReply()
  );

  context.session.messageIdsStack.push(message.message_id);

  if (next) return next();
};
