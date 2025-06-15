import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { claims, pools, positions, settings, users, wallets } from "./schema";

export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);

export const selectSettingsSchema = createSelectSchema(settings);
export const insertSettingSChema = createInsertSchema(settings);

export const selectClaimSchema = createSelectSchema(claims);
export const insertClaimSchema = createInsertSchema(claims);

export const selectPoolSchema = createSelectSchema(pools);
export const insertPoolSchema = createInsertSchema(pools);

export const selectPositionSchema = createSelectSchema(positions);
export const insertPositionSchema = createInsertSchema(positions);

export const selectWalletSchema = createSelectSchema(wallets);
export const insertWalletSchema = createInsertSchema(wallets);
