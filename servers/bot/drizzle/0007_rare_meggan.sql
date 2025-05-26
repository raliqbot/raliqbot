ALTER TABLE "settings" ALTER COLUMN "slippage" SET DEFAULT '0.5';--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "position" text NOT NULL;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "metadata" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "signature" text NOT NULL;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_position_positions_id_fk" FOREIGN KEY ("position") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;