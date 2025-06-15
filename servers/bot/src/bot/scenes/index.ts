import { Scenes, type Telegraf } from "telegraf";

import { searchPairScene } from "./search-pair-scene";
import { createPositionScene } from "./create-position-scene";

export default function registerScenes(bot: Telegraf) {
  const stage = new Scenes.Stage<any>([createPositionScene, searchPairScene]);
  bot.use(stage.middleware());
}
