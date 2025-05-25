import { Scenes } from "telegraf";

import { cancel } from "./cancel";
import { editRange } from "./edit-range";
import { inputAmount } from "./input-amount";
import { onEditRange } from "./on-edit-range";
import { openPosition } from "./open-position";
import { onInputAmount } from "./on-input-amount";
import { confirmPosition } from "./confirm-position";
import { recommendRange } from "./middleware/recommend-range";
import { authenticateUser } from "../..//middlewares/authenticate-user";

export const createSpotPositionSceneId = "create-spot-position-scene";
export const createSpotPositionScene = new Scenes.WizardScene(
  createSpotPositionSceneId,
  async (context) => {
    return inputAmount(context, async () => context.wizard.next());
  },
  async (context) => {
    return onInputAmount(context, () =>
      confirmPosition(context, async () => context.wizard.next())
    );
  },
  async (context) => {
    return editRange(context, async () => context.wizard.next());
  },
  async (context) => {
    return onEditRange(context, async () => context.wizard.next());
  }
);

createSpotPositionScene.use(recommendRange);
createSpotPositionScene.action("cancel", cancel);
createSpotPositionScene
  .use(authenticateUser)
  .action("open-position", openPosition);
