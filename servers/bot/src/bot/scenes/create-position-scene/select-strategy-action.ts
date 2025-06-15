import { Context } from "telegraf";

export const selectStrategyAction = (context: Context) => {
  const text =
    context.callbackQuery && "data" in context.callbackQuery
      ? context.callbackQuery.data
      : undefined;

  if (text) {
    if (text in ["bid-ask", "curve", "spot"]) {
    }
  }
};
