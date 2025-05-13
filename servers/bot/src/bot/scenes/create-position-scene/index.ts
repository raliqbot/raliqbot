import { Scenes } from "telegraf";
import { message } from "telegraf/filters";

import { cancel } from "./cancel";
import { editRange } from "./edit-range";
import { inputAmount } from "./input-amount";
import { onEditRange } from "./on-edit-range";
import { openPosition } from "./open-position";
import { onInputAmount } from "./on-input-amount";
import { confirmPosition } from "./confirm-position";
import { chooseAlgorithm } from "./choose-algorithm";
import { onChooseMintSide } from "./on-choose-mint-side";
import { recommendRange } from "./middleware/recommend-range";
import { authenticateUser } from "../..//middlewares/authenticate-user";
import { chooseMintSide } from "./choose-mint-side";

export const createPositionSceneId = "create-position-scene";
export const createPositionScene = new Scenes.WizardScene(
  createPositionSceneId,
  async (context) => {
    return chooseAlgorithm(
      context,
      async () => (context.session.next = "choose-mint")
    );
  },
  async (context) => {
    if (context.callbackQuery && "data" in context.callbackQuery) {
      const data = context.callbackQuery.data;
      context.session.createPosition.algorithm = data as
        | "spot"
        | "single-sided";

      if (data === "spot") {
        return inputAmount(
          context,
          async () => (context.session.next = "on-input-amount")
        );
      } else {
        return chooseMintSide(
          context,
          async () => (context.session.next = "on-choose-mint")
        );
      }
    }
  },
  async (context) => {
    if (context.session.next === "on-choose-mint") {
      return onChooseMintSide(context, async () => {
        return inputAmount(
          context,
          async () => (context.session.next = "on-input-amount")
        );
      });
    } else {
      return onInputAmount(context, async () => {
        return confirmPosition(
          context,
          async () => (context.session.next = "edit-range")
        );
      });
    }
  },
  async (context) => {
    if (context.session.next === "on-input-amount") {
      return onInputAmount(context, async () => {
        return confirmPosition(
          context,
          async () => (context.session.next = "edit-range")
        );
      });
    } else
      editRange(context, async () => {
        context.wizard.next();
        context.session.next = "on-edit-range";
      });
  },
  async (context) => {
    if (context.session.next === "edit-range") {
      return editRange(context, async () => {
        context.wizard.next();
        context.session.next = "on-edit-range";
      });
    } else {
      return onEditRange(context, async () => {
        context.session.next = "edit-range";
        context.wizard.back();
      });
    }
  },
  async (context) => {
    if (context.session.next === "edit-range") {
      return editRange(context, async () => {
        context.session.next = "on-edit-range";
      });
    } else if (context.session.next === "on-edit-range") {
      return onEditRange(context, async () => {
        context.session.next = "edit-range";
      });
    }
  }
);

createPositionScene.use(recommendRange);
createPositionScene.action("cancel", cancel);
createPositionScene.use(authenticateUser).action("open-position", openPosition);
