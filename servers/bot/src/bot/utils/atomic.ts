import type { Context } from "telegraf";

import { cleanText } from "./format";

export const onError = async (context: Context, error: unknown) => {
  const message =
    error instanceof Error ? error.message : JSON.stringify(error);
  if (context.chat && context.session.messageIdsStack)
    context.telegram
      .deleteMessages(context.chat.id, context.session.messageIdsStack)
      .then(() => (context.session.messageIdsStack = []));
  if (context.scene.current) await context.scene.leave();
  return context.replyWithMarkdownV2(cleanText(message));
};

type AtomicOptions = {
  silent?: boolean;
  chatAction?: "typing";
  onError?: (context: Context, error: unknown) => void;
};

export const atomic = <
  T extends Context,
  Fn extends (context: T) => unknown | Promise<unknown>
>(
  fn: Fn,
  options?: AtomicOptions
) => {
  const defaultOptions = {
    onError,
    silent: false,
    chatAction: "typing" as const,
    ...options,
  };

  return async (context: T) =>
    context.persistentChatAction(defaultOptions.chatAction, async () => {
      await Promise.all([fn(context)])
        .then(([result]) => result)
        .catch((error) => {
          if (!defaultOptions.silent) {
            if (defaultOptions.onError)
              return defaultOptions.onError(context, error);
            return Promise.reject(error);
          }

          return;
        });
    });
};
