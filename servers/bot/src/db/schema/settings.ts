import { decimal, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const settings = pgTable("settings", {
  id: uuid().defaultRandom().primaryKey(),
  user: text()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  vaultAddress: text(),
  slippage: decimal().default("0.05").notNull(),
  priorityFees: decimal().default("0.0001").notNull(),
  rebalanceSchedule: integer().default(216000).notNull(),
});
