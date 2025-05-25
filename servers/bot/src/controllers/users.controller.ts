import type { z } from "zod";

import type { Database } from "../db";
import { insertUserSchema } from "../db/zod";
import { settings, users, wallets } from "../db/schema";

export const createUser = async (
  db: Database,
  value: z.infer<typeof insertUserSchema>
) => {
  const [user] = await db
    .insert(users)
    .values(value)
    .onConflictDoUpdate({ target: [users.id], set: value })
    .returning()
    .execute();

  const [wallet] = await db
    .insert(wallets)
    .values({ user: user.id, name: "default" })
    .onConflictDoUpdate({
      target: [wallets.user, wallets.name],
      set: { user: user.id },
    })
    .returning()
    .execute();

  const [setting] = await db
    .insert(settings)
    .values({ user: user.id })
    .onConflictDoUpdate({ target: [settings.user], set: { user: user.id } })
    .returning()
    .execute();

  return { ...user, wallet, settings: setting };
};
