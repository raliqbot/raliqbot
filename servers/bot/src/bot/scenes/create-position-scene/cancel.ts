import type { Context } from "telegraf";

export const cancel =  (context: Context) => {
  context.deleteMessages(context.session.messageIdsStack);
  context.session.messageIdsStack = [];
  return context.scene.leave();
}