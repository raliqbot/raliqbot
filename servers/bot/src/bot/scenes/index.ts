import { Context, Scenes, type Telegraf } from "telegraf";

export default function registerScenes(bot: Telegraf) {
  const stage = new Scenes.Stage<any>([]);
  bot.use(stage.middleware());
}
