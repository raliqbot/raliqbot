ALTER TABLE "users" ADD COLUMN "rewardExecutionTime" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "repositionExecutionTime" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "positions" ADD COLUMN "algorithm" text NOT NULL;--> statement-breakpoint
ALTER TABLE "positions" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;