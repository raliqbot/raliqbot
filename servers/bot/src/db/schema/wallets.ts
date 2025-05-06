import { web3 } from "@coral-xyz/anchor";
import { pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";
import { encrypt } from "../../core";
import { secretKey } from "../../instances";

export const wallets = pgTable(
  "wallets",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    key: text()
      .$defaultFn(() => {
        const { secretKey: data } = web3.Keypair.generate();
        return encrypt(secretKey, data.toBase64());
      })
      .notNull(),

    user: text()
      .references(() => users.id)
      .notNull(),
  },
  (column) => ({
    uniqueWallet: unique().on(column.user, column.name).nullsNotDistinct(),
  })
);
