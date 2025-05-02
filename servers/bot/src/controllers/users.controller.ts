import type { Database } from "../db";
import { users, wallets } from "../db/schema";
import { insertUserSchema } from "../db/zod";

export const createUser = async (
  db: Database,
  value: Zod.infer<typeof insertUserSchema>
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
    .returning();

  return { ...user, wallet };
};
