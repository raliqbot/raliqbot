import { Scenes } from "telegraf";

export const changeRescheduleSceneId = "change-reschedule-scene";

export const changeRescheduleScene = new Scenes.WizardScene(
  changeRescheduleSceneId,
  async () => {},
  async () => {}
);
