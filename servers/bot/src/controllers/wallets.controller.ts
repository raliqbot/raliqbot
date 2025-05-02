import bs58 from "bs58";
import { eq } from "drizzle-orm";
import { web3 } from "@coral-xyz/anchor";

import type { Database } from "../db";
import { wallets } from "../db/schema";
import { decrypt } from "../core/secret";
import { secretKey } from "../instances";
import {
  insertWalletSchema,
  selectUserSchema,
  selectWalletSchema,
} from "../db/zod";

export const createWallet = (
  db: Database,
  value: Zod.infer<typeof insertWalletSchema>
) => db.insert(wallets).values(value).returning().execute();

export const getWalletsByUser = (
  db: Database,
  user: Zod.infer<typeof selectUserSchema>["id"]
) =>
  db.query.wallets
    .findMany({
      where: eq(wallets.user, user),
    })
    .execute();

export const loadWallet = (
  wallet: Pick<Zod.infer<typeof selectWalletSchema>, "key">
) => {
  const data = decrypt<number[]>(secretKey, wallet.key);
  return web3.Keypair.fromSecretKey(Buffer.from(data));
};
