import { pgTable, uuid } from "drizzle-orm/pg-core";

export const claims = pgTable("claims", {
  id: uuid().defaultRandom().primaryKey(),
});
