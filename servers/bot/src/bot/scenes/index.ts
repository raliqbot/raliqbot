import { Scenes, type Telegraf } from "telegraf";

export default function registerScenes(bot: Telegraf) {
  const stage = new Scenes.Stage([]);
  bot.use(stage.middleware());
}
