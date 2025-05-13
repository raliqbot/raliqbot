import { Context } from "telegraf";
import {
  SceneContextScene,
  WizardSessionData,
  WizardContextWizard,
} from "telegraf/typings/scenes";

export type WizardContext = Context & {
  scene: SceneContextScene<Context, WizardSessionData>;
  wizard: WizardContextWizard<Context>;
};
