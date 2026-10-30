CREATE TABLE `experience_links` (
	`experience_id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`require_login` integer DEFAULT true NOT NULL,
	`username` text DEFAULT '' NOT NULL,
	`password_hash` text,
	`revision` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `experience_links_slug_unique` ON `experience_links` (`slug`);--> statement-breakpoint
CREATE TABLE `viewer_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`started` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `viewer_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`experience_id` text NOT NULL,
	`revision` integer NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade
);
