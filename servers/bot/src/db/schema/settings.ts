import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

type SettingsData = {
  locale: "em";
  slippage: number;
  priorityFees?: number;
  vaultAddress?: string;
  rebalanceSchedule: number;
};

export const settings = pgTable("settings", {
  id: uuid().defaultRandom().primaryKey(),
  user: text()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  data: jsonb()
    .$type<SettingsData>()
    .default({
      locale: "em",
      slippage: 0.05,
      rebalanceSchedule: 108000,
    })
    .notNull(),
});
