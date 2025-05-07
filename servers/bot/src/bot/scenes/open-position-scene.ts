import { Composer, type Context, Scenes } from "telegraf";

import { format } from "../../core";
import { isValidAddress } from "../utils";
import { onTrending } from "../commands/get-trending-command";
import { onOpenPosition } from "../commands/open-position-command";

const composer = new Composer();

const onAddress = async (context: Context) => {
  const address =
    context.message &&
    "text" in context.message &&
    isValidAddress(context.message.text)
      ? context.message.text
      : context.session.openPosition.address;

  if (context.message && "text" in context.message && address) {
    context.message.text = format("open-%", address);
    await onOpenPosition(context);
    return context.scene.leave();
  } else return context.scene.leave();
};

composer.on("message", onAddress);

export const openPositionSceneId = "open-position-scene-id";

export const openPositionScene = new Scenes.WizardScene(
  openPositionSceneId,
  async (context) => {
    if (context.session.openPosition && context.session.openPosition.address)
      return onAddress(context);
    else await onTrending(context);

    return context.wizard.next();
  },
  composer
);
