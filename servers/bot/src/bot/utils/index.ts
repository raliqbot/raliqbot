import { Context } from "telegraf";
import { cleanText } from "./format";

export * from "./format";

export const handleError = async <T extends (context: Context) => unknown>(
  fn: T
) => {
  return async (context: Context) => {
    try {
      return await fn(context);
    } catch (error) {
      return context.replyWithMarkdownV2(cleanText(String(error)));
    }
  };
};
