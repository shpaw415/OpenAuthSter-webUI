ALTER TABLE `openauth_webui_users` RENAME COLUMN "email" TO "identifier";--> statement-breakpoint
CREATE TABLE `openauth_webui_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`clientID` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`timestamp` text NOT NULL
);
--> statement-breakpoint
DROP INDEX `openauth_webui_users_email_unique`;--> statement-breakpoint
ALTER TABLE `openauth_webui_users` ADD `session_private` text;--> statement-breakpoint
ALTER TABLE `openauth_webui_users` ADD `session_public` text;--> statement-breakpoint
CREATE UNIQUE INDEX `openauth_webui_users_identifier_unique` ON `openauth_webui_users` (`identifier`);--> statement-breakpoint
ALTER TABLE `openauth_webui_projects` ADD `originURL` text;--> statement-breakpoint
ALTER TABLE `openauth_webui_projects` ADD `secret` text NOT NULL;--> statement-breakpoint
ALTER TABLE `openauth_webui_projects` ADD `authEndpointURL` text NOT NULL;--> statement-breakpoint
ALTER TABLE `openauth_webui_projects` ADD `cloudflareDomaineID` text NOT NULL;