import type { z } from "zod";
import { eq, SQL } from "drizzle-orm";

import { Database } from "../db";
import { positions } from "../db/schema";
import { insertPositionSchema, selectPositionSchema } from "../db/zod";

export const createPositions = (
  db: Database,
  ...values: z.infer<typeof insertPositionSchema>[]
) => db.insert(positions).values(values).returning().execute();

export const getPositionById = (
  db: Database,
  id: z.infer<typeof selectPositionSchema>["id"]
) =>
  db.query.positions
    .findFirst({
      where: eq(positions.id, id),
    })
    .execute();

export const getPositionsWhere = (db: Database, where?: SQL<unknown>) =>
  db.query.positions.findMany({ where }).execute();

export const updatePositionById = (
  db: Database,
  id: z.infer<typeof selectPositionSchema>["id"],
  value: Partial<z.infer<typeof insertPositionSchema>>
) =>
  db
    .update(positions)
    .set(value)
    .where(eq(positions.id, id))
    .returning()
    .execute();
