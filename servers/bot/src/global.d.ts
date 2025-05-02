import type { Context } from "telegraf";
import type { web3 } from "@coral-xyz/anchor";
import type { selectUserSchema, selectWalletSchema } from "./db/zod";

declare module "telegraf" {
  interface Context {
    user: Zod.infer<typeof selectUserSchema> & {
      wallet: Zod.infer<typeof selectWalletSchema>;
    };
    wallet: web3.Keypair,
    session: {};
  }
}
