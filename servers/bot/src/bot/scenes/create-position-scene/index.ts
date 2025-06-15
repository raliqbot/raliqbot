import { Scenes } from "telegraf";

export const createPositionSceneId = "create-position-scene-id";

export const createPositionScene = new Scenes.WizardScene(
  createPositionSceneId,
  () => {}
);
