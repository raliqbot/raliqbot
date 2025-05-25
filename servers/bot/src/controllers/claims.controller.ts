import type { z } from "zod";

import { claims } from "../db/schema";
import type { Database } from "../db";
import { insertClaimSchema, selectClaimSchema } from "../db/zod";

export const createClaims = (
  db: Database,
  ...value: z.infer<typeof insertClaimSchema>[]
) => db.insert(claims).values(value).returning().execute();

export const updateClaimById = (
  db: Database,
  id: z.infer<typeof selectClaimSchema>,
  value: Partial<z.infer<typeof insertClaimSchema>>
) => db.update(claims).set(value).returning().execute();
