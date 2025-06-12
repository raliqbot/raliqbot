import type { z } from "zod";
import type { web3 } from "@coral-xyz/anchor";
import type { Context, Scenes, WizardContext } from "telegraf";

import type {
  selectSettingsSchema,
  selectUserSchema,
  selectWalletSchema,
} from "./db/zod";

type SessionData = {
  messageIdsStack: number[];
};

type Session = SessionData & Scenes.SceneSessionData;

declare module "telegraf" {
  interface Context extends Scenes.WizardContext<Session> {
    wallet: web3.Keypair;
    user: z.infer<typeof selectUserSchema> & {
      wallet: z.infer<typeof selectWalletSchema>;
      settings: z.infer<typeof selectSettingsSchema>;
    };
    session: Session & Scenes.SceneSession<Session>;
    scene: Scenes.SceneContext<Context, Session>;
  }
}
