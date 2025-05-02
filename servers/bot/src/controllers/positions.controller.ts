import { eq, SQL } from "drizzle-orm";
import { Database } from "../db";
import { positions } from "../db/schema";
import { claims } from "../db/schema/claims";
import { insertPositionSchema, selectPositionSchema } from "../db/zod";

export const createPosition = (
  db: Database,
  value: Zod.infer<typeof insertPositionSchema>
) => db.insert(claims).values(value).returning().execute();

export const getPositionsWhere = (db: Database, where: SQL<unknown>) =>
  db.query.positions.findMany({ where }).execute();

export const updatePositionById = (
  db: Database,
  id: Zod.infer<typeof selectPositionSchema>["id"],
  value: Partial<Zod.infer<typeof insertPositionSchema>>
) =>
  db
    .update(positions)
    .set(value)
    .where(eq(positions.id, id))
    .returning()
    .execute();
