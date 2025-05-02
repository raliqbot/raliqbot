import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { claims, positions, users, wallets } from "./schema";

export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);

export const insertClaimSchema = createInsertSchema(claims);

export const selectPositionSchema = createSelectSchema(positions);
export const insertPositionSchema = createInsertSchema(positions);

export const selectWalletSchema = createSelectSchema(wallets);
export const insertWalletSchema = createInsertSchema(wallets);