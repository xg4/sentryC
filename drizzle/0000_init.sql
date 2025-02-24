CREATE TYPE "public"."ping_status" AS ENUM('success', 'failure');--> statement-breakpoint
CREATE TABLE "ip_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"cidr" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ip_addresses_ip_unique" UNIQUE("ip")
);
--> statement-breakpoint
CREATE TABLE "ping_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_address" text NOT NULL,
	"latency" real,
	"status" "ping_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ping_results" ADD CONSTRAINT "ping_results_ip_address_ip_addresses_ip_fk" FOREIGN KEY ("ip_address") REFERENCES "public"."ip_addresses"("ip") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ip_addresses_ip_created_at_index" ON "ip_addresses" USING btree ("ip","created_at");--> statement-breakpoint
CREATE INDEX "ip_addresses_created_at_index" ON "ip_addresses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ping_results_ip_address_status_index" ON "ping_results" USING btree ("ip_address","status");--> statement-breakpoint
CREATE INDEX "ping_results_ip_address_created_at_index" ON "ping_results" USING btree ("ip_address","created_at");--> statement-breakpoint
CREATE INDEX "ping_results_created_at_index" ON "ping_results" USING btree ("created_at");