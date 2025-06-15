import type { z } from "zod";
import type { Ratio } from "@raliqbot/lib";
import type DLMM, { type LbPosition, StrategyType } from "@meteora-ag/dlmm";
import type { Connection, Keypair } from "@solana/web3.js";
import type { Context, Scenes, WizardContext } from "telegraf";

import type {
  selectSettingsSchema,
  selectUserSchema,
  selectWalletSchema,
} from "./db/zod";

type SessionData = {
  cachedPoolWithPositions: Record<
    string,
    { pool: DLMM; positions: LbPosition[] }
  >;
  pools: Record<string, DLMM>;
  createPosition: {
    ratio?: Ratio;
    poolId?: string;
    amount?: number;
    strategy?: StrategyType;
    rangeIntervals?: [number, number];
  };
  messageIdsStack: number[];
};

type Session = SessionData & Scenes.SceneSessionData;

declare module "telegraf" {
  interface Context extends Scenes.WizardContext<Session> {
    connection: Connection;
    wallet: Keypair;
    user: z.infer<typeof selectUserSchema> & {
      wallet: z.infer<typeof selectWalletSchema>;
      settings: z.infer<typeof selectSettingsSchema>;
    };
    session: Session & Scenes.SceneSession<Session>;
    scene: Scenes.SceneContextScene<Scenes.SceneContext<Session>, Session>;
  }
}
