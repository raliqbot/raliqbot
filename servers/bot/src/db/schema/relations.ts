import { relations } from "drizzle-orm";

import { users } from "./users";
import { pools } from "./pools";
import { wallets } from "./wallets";
import { positions } from "./positions";

export const usersRelation = relations(users, ({ many }) => ({
  wallets: many(wallets),
}));

export const walletsRelation = relations(wallets, ({ one, many }) => ({
  positions: many(positions),
  user: one(users, { fields: [wallets.user], references: [users.id] }),
}));

export const poolRelation = relations(pools, ({ many }) => ({
  positions: many(positions),
}));

export const positionsRelation = relations(positions, ({ one }) => ({
  pool: one(pools, { fields: [positions.pool], references: [pools.id] }),
  wallet: one(wallets, {
    fields: [positions.wallet],
    references: [wallets.id],
  }),
}));
