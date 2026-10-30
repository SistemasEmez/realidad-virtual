-- Órbita AR Studio · SQLite / Cloudflare D1
PRAGMA foreign_keys = ON;

-- 0000_odd_deadpool.sql
CREATE TABLE `experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`config` text NOT NULL,
	`updated` text NOT NULL
);


-- 0001_wild_lady_vermin.sql
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


-- 0002_heavy_siren.sql
CREATE TABLE `panel_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`revision` integer NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `panel_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `panel_setup` (
	`key` text PRIMARY KEY NOT NULL,
	`completed` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `panel_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `panel_users_username_unique` ON `panel_users` (`username`);

