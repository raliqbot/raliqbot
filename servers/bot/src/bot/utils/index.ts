import { Context } from "telegraf";
import { web3 } from "@coral-xyz/anchor";

import { cleanText } from "./format";

export * from "./format";

export const isValidAddress = (address: string) => {
  try {
    new web3.PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const catchBotRuntimeError = <
  U extends Context,
  T extends (context: U) => unknown
>(
  fn: T,
  silent = false,
  onError?: (context: Context, error: unknown) => void
) => {
  return async (...[context]: Parameters<T>) => {
    try {
      return await fn(context);
    } catch (error) {
      if (onError) onError(context, error);

      if (!silent) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        context.telegram.deleteMessages(
          context.chat!.id,
          context.session.messageIdsStack
        );
        await context.scene.leave();
        return context.replyWithMarkdownV2(cleanText(message));
      }
    }
  };
};

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
