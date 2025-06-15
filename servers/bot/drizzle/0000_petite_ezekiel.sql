CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lastLogin" timestamp DEFAULT now() NOT NULL,
	"rewardExecutionTime" timestamp DEFAULT now() NOT NULL,
	"repositionExecutionTime" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pools" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"user" text NOT NULL,
	CONSTRAINT "wallets_user_name_unique" UNIQUE NULLS NOT DISTINCT("user","name")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"signature" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user" text NOT NULL,
	"data" jsonb DEFAULT '{"locale":"em","slippage":0.05,"rebalanceSchedule":108000}'::jsonb NOT NULL,
	CONSTRAINT "settings_user_unique" UNIQUE("user")
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" text PRIMARY KEY NOT NULL,
	"pool" text NOT NULL,
	"wallet" uuid NOT NULL,
	"signature" text,
	"algorithm" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_position_positions_id_fk" FOREIGN KEY ("position") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_wallet_wallets_id_fk" FOREIGN KEY ("wallet") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;