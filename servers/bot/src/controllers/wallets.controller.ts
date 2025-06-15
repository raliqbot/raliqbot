import type { z } from "zod";
import { and, eq } from "drizzle-orm";
import { Keypair } from "@solana/web3.js";

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
  value: z.infer<typeof insertWalletSchema>
) => db.insert(wallets).values(value).returning().execute();

export const getWalletsByUser = (
  db: Database,
  user: z.infer<typeof selectUserSchema>["id"]
) =>
  db.query.wallets
    .findMany({
      where: eq(wallets.user, user),
    })
    .execute();

export const updateWalletByUserAndId = (
  db: Database,
  user: z.infer<typeof selectUserSchema>["id"],
  id: z.infer<typeof selectWalletSchema>["id"],
  value: Partial<z.infer<typeof insertWalletSchema>>
) =>
  db
    .update(wallets)
    .set(value)
    .where(and(eq(wallets.user, user), eq(wallets.id, id)))
    .returning()
    .execute();

export const loadWallet = (
  wallet: Pick<z.infer<typeof selectWalletSchema>, "key">
) => {
  const data = decrypt<string>(secretKey, wallet.key);
  return Keypair.fromSecretKey(Buffer.from(data, "base64"));
};
