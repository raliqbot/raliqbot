import type { Context } from "telegraf";

export const useChatGuardFn = <
  U extends Context,
  T extends (context: U) => unknown
>(
  next: (context: U, next: T) => ReturnType<T>
) => {
  return (fn: T) => (context: U) => next(context, fn);
};

export const chatIs = <U extends Context>(
  context: U,
  chatType: "private" | "group" | "supergroup" | "channel"
) => context.chat && context.chat.type === chatType;

export const usePrivateFn = useChatGuardFn((context, next) => {
  if (chatIs(context, "private")) return next(context);
});
