ALTER TABLE "settings" ALTER COLUMN "slippage" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "slippage" SET DEFAULT '0.05';--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "priorityFees" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "priorityFees" SET DEFAULT '0.0001';