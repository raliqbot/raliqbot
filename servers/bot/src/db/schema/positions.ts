import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { wallets } from "./wallets";

export type PositionMetadata = {};

export const positions = pgTable("positions", {
  id: text().primaryKey(),
  pool: text().notNull(),
  wallet: uuid()
    .references(() => wallets.id)
    .notNull(),
  signature: text(),
  algorithm: text({ enum: ["spot", "single-sided"] }).notNull(),
  metadata: jsonb().$type<PositionMetadata>().notNull(),
  active: boolean().default(true).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});
