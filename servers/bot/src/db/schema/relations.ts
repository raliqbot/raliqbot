import { relations } from "drizzle-orm";

import { users } from "./users";
import { pools } from "./pools";
import { claims } from "./claims";
import { wallets } from "./wallets";
import { settings } from "./settings";
import { positions } from "./positions";

export const usersRelation = relations(users, ({ many, one }) => ({
  wallets: many(wallets),
  settings: one(settings),
}));

export const settingsRelation = relations(settings, ({ one }) => ({
  user: one(users, { fields: [settings.user], references: [users.id] }),
}));

export const walletsRelation = relations(wallets, ({ one, many }) => ({
  positions: many(positions),
  user: one(users, { fields: [wallets.user], references: [users.id] }),
}));

export const poolRelation = relations(pools, ({ many }) => ({
  positions: many(positions),
}));

export const positionsRelation = relations(positions, ({ one, many }) => ({
  claims: many(claims),
  pool: one(pools, { fields: [positions.pool], references: [pools.id] }),
  wallet: one(wallets, {
    fields: [positions.wallet],
    references: [wallets.id],
  }),
}));

export const claimsRelations = relations(claims, ({ one }) => ({
  position: one(positions, {
    fields: [claims.position],
    references: [positions.id],
  }),
}));
