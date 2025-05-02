import type { Context, Scenes } from "telegraf";
import type { web3 } from "@coral-xyz/anchor";
import type {
  ApiV3PoolInfoConcentratedItem,
  ClmmPoolInfo,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import type { selectUserSchema, selectWalletSchema } from "./db/zod";

type SessionData = {
  createPosition: {
    amount?: number;
    mint?: string;
    info?: ApiV3PoolInfoConcentratedItem;
  };
};

type Session = SessionData;

declare module "telegraf" {
  interface Context extends Scenes.WizardContext<Session> {
    user: Zod.infer<typeof selectUserSchema> & {
      wallet: Zod.infer<typeof selectWalletSchema>;
    };
    wallet: web3.Keypair;
    raydium: Raydium;
    session: Session;
    scene: Scenes.SceneContext["scene"];
  }
}
