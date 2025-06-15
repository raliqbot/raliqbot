import type { z } from "zod";
import { eq, SQL } from "drizzle-orm";

import { Database } from "../db";
import { pools } from "../db/schema";
import { insertPoolSchema } from "../db/zod";

export const createPools = (
  db: Database,
  ...values: z.infer<typeof insertPoolSchema>[]
) =>
  db
    .insert(pools)
    .values(values)
    .onConflictDoUpdate({ target: pools.id, set: { id: pools.id } })
    .returning()
    .execute();
