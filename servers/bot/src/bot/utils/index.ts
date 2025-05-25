import { Context } from "telegraf";

import { cleanText } from "./format";

export * from "./format";

export const privateFunc = <
  U extends Context,
  T extends (context: U) => unknown
>(
  fn: T
) => {
  return async (...[context]: Parameters<T>) => {
    if (context.chat?.type === "private") return await fn(context);
  };
};

export const onError = async (context: Context, error: unknown) => {
  const message =
    error instanceof Error ? error.message : JSON.stringify(error);
  context.telegram.deleteMessages(
    context.chat!.id,
    context.session.messageIdsStack
  );
  if (context.scene.current) await context.scene.leave();
  return context.replyWithMarkdownV2(cleanText(message));
};
