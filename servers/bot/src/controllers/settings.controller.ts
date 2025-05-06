import { eq } from "drizzle-orm";

import { Database } from "../db";
import { settings } from "../db/schema";
import { insertSettingSChema, selectUserSchema } from "../db/zod";

export const updateSettingsByUser = (
  db: Database,
  user: Zod.infer<typeof selectUserSchema>["id"],
  value: Partial<Zod.infer<typeof insertSettingSChema>>
) =>
  db
    .update(settings)
    .set(value)
    .where(eq(settings.user, user))
    .returning()
    .execute();
