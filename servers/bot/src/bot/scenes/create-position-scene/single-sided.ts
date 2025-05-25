import { Scenes } from "telegraf";

import { cancel } from "./cancel";
import { editRange } from "./edit-range";
import { inputAmount } from "./input-amount";
import { onEditRange } from "./on-edit-range";
import { openPosition } from "./open-position";
import { onInputAmount } from "./on-input-amount";
import { chooseMintSide } from "./choose-mint-side";
import { confirmPosition } from "./confirm-position";
import { onChooseMintSide } from "./on-choose-mint-side";
import { recommendRange } from "./middleware/recommend-range";
import { authenticateUser } from "../..//middlewares/authenticate-user";

export const createSingleSidedPositionSceneId =
  "create-single-sided-position-scene";
export const createSingleSidedPositionScene = new Scenes.WizardScene(
  createSingleSidedPositionSceneId,

  async (context) => {
    return chooseMintSide(context, async () => context.wizard.next());
  },
  async (context) => {
    return onChooseMintSide(context, async () =>
      inputAmount(context, async () => context.wizard.next())
    );
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
    return onEditRange(context);
  }
);

createSingleSidedPositionScene.use(recommendRange);
createSingleSidedPositionScene.action("cancel", cancel);
createSingleSidedPositionScene
  .use(authenticateUser)
  .action("open-position", openPosition);
