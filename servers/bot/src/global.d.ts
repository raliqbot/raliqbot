import type { z } from "zod";
import type { web3 } from "@coral-xyz/anchor";
import type { Context, Scenes, WizardContext } from "telegraf";
import type {
  ApiV3PoolInfoConcentratedItem,
  ApiV3PoolInfoItem,
  ClmmPoolInfo,
  ClmmPositionLayout,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import type {
  selectSettingsSchema,
  selectUserSchema,
  selectWalletSchema,
} from "./db/zod";
import { getPortfolio } from "@raliqbot/lib";

type SessionData = {
  next?: string;
  openPosition: {
    amount?: number;
    address?: string;
  };
  createPosition: {
    mint?: string;
    amount?: number;
    skipSwapA?: boolean;
    skipSwapB?: boolean;
    loading?: boolean;
    messageId?: number;
    range: [number, number];
    singleSided?: "MintA" | "MintB";
    algorithm?: "single-sided" | "spot";
    info?: ApiV3PoolInfoConcentratedItem;
  };
  closePosition: {
    position?: ClmmPositionLayout;
  };
  positionsCache: {
    positions: Awaited<ReturnType<Raydium["clmm"]["getOwnerPositionInfo"]>>;
  };
  messageId?: number;
  messageIdsStack: number[];
  searchCache: Record<string, ApiV3PoolInfoItem[]>;
  cachedPositions: Record<
    string,
    Awaited<ReturnType<typeof getPortfolio>>[number]["positions"][number] & {
      poolInfo: ApiV3PoolInfoConcentratedItem;
    }
  >;
  cachedPoolInfos: Record<string, ApiV3PoolInfoItem[]>;
};

type Session = SessionData;

declare module "telegraf" {
  interface Context extends Scenes.WizardContext<Session> {
    user: z.infer<typeof selectUserSchema> & {
      wallet: z.infer<typeof selectWalletSchema>;
      settings: z.infer<typeof selectSettingsSchema>;
    };
    wallet: web3.Keypair;
    raydium: Raydium;
    session: Session;
    scene: Scenes.SceneContext["scene"];
  }

  interface WizardContext extends Context {
    wizard: Scenes.WizardContext["wizard"];
  }
}

declare global {
  interface StringConstructor {
    empty: () => string;
  }
}

String.empty = () => "";
