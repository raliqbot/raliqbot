import type { Context } from "telegraf";

import { onError } from ".";

type AtomicOptions = {
  silent?: boolean;
  typingInterval?: number;
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
    typingInterval: 10000,
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
