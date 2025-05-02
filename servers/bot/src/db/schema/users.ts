import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text().primaryKey(),
  lastLogin: timestamp().defaultNow().notNull(),
});
