CREATE TABLE `ips` (
	`address` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `latency_records` (
	`id` text PRIMARY KEY NOT NULL,
	`latency` real NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`ip_address` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ip_index` ON `latency_records` (`ip_address`,`created_at`);--> statement-breakpoint
CREATE INDEX `created_at_index` ON `latency_records` (`created_at`);