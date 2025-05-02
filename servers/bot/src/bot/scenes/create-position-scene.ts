import { Markup, Scenes } from "telegraf";

export const createPositionSceneId = "create-position-scene";

export const createPositionScene = new Scenes.WizardScene(
  createPositionSceneId,
  async (context) => {
    await context.replyWithMarkdownV2(
      "Enter amount of SOL you want to use to create this LP position",
      Markup.forceReply()
    );

    return context.wizard.next();
  },
  async (context) => {
    const message = context.message;
    if (message && "text" in message) {
      // do something with the amount

      return context.scene.leave();
    }
  }
);
