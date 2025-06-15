import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

type SettingsData = {
  locale: "en";
  slippage: number;
  priorityFees?: number;
  vaultAddress?: string;
  rebalanceSchedule: number;
  poolSearchConfig?: {
    poolType?: "DLMMM";
    marketCap?: {
      lessThan?: number;
      greaterThan?: number;
    };
  };
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
      locale: "en",
      slippage: 0.05,
      rebalanceSchedule: 108000,
    })
    .notNull(),
});
