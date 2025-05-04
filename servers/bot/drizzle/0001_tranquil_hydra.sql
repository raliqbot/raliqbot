CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user" text,
	"vaultAddress" text,
	"slippage" integer DEFAULT 0.05 NOT NULL,
	"priorityFees" integer DEFAULT 0.0001 NOT NULL,
	"rebalanceSchedule" integer DEFAULT 216000 NOT NULL,
	CONSTRAINT "settings_user_unique" UNIQUE("user")
);
--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;