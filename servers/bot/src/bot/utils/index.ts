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
  fn: T
) => {
  return async (...[context]: Parameters<T>) => {
    try {
      return await fn(context);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      context.session.openPosition = {};
      context.session.createPosition = { range: [0.15, 0.15] };
      context.telegram.deleteMessages(
        context.chat!.id,
        context.session.messageIdsStack
      );
      await context.scene.leave();
      return context.replyWithMarkdownV2(cleanText(message));
    }
  };
};
