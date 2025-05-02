import { pgTable, text } from "drizzle-orm/pg-core";

export const pools = pgTable("pools", {
  id: text().primaryKey(),
});
