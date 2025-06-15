import { Context } from "telegraf";

export const selectRatioAction = (context: Context) => {
  const text =
    context.callbackQuery && "data" in context.callbackQuery
      ? context.callbackQuery.data
      : undefined;
  if (text) {
  }
};
