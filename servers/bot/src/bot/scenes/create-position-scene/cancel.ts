import type { Context } from "telegraf";

export const cancel = (context: Context) => {
  context.deleteMessages(context.session.messageIdsStack);
  context.session.next = undefined;
  context.session.createPosition = {
    info: context.session.createPosition.info,
    range: [0.15, 0.15],
  };

  context.session.messageIdsStack = [];
  return context.scene.leave();
};
