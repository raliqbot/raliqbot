import { Composer, Scenes } from "telegraf";

import { format } from "../../core";
import { isValidAddress } from "../utils";
import { onTrending } from "../commands/get-trending-command";
import { onOpenPosition } from "../commands/open-position-command";

const composer = new Composer();

composer.on("message", (context) => {
  if (
    context.message &&
    "text" in context.message &&
    isValidAddress(context.message.text)
  ) {
    context.message.text = format("open-%", context.message.text);
    return onOpenPosition(context);
  }
});

export const openPositionSceneId = "open-position-scene-id";

export const openPositionScene = new Scenes.WizardScene(
  openPositionSceneId,
  async (context) => {
    await onTrending(context);
    return context.wizard.next();
  },
  composer
);
