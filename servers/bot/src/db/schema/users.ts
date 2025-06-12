import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  lastLogin: timestamp().defaultNow().notNull(),
  rewardExecutionTime: timestamp().defaultNow().notNull(),
  repositionExecutionTime: timestamp().defaultNow().notNull(),
});
