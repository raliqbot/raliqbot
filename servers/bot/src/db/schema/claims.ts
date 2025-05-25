import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { positions } from "./positions";

type Metadata = {
  tokenBalances: Record<string, string>;
};

export const claims = pgTable("claims", {
  id: uuid().defaultRandom().primaryKey(),
  position: text()
    .references(() => positions.id)
    .notNull(),
  metadata: jsonb().$type<Metadata>().notNull(),
  signature: text().notNull(),
});
