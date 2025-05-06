import { Context } from "telegraf";
import { cleanText } from "./format";
import { web3 } from "@coral-xyz/anchor";

export * from "./format";

export const isValidAddress = (address: string) => {
  try {
    new web3.PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const catchBotRuntimeError =  <T extends (context: Context) => unknown>(
  fn: T
) => {
  return async (context: Context) => {
    try {
      return await fn(context);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      return context.replyWithMarkdownV2(cleanText(message));
    }
  };
};
