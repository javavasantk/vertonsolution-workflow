CREATE TABLE `consultant_time_entry_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timeEntryId` int NOT NULL,
	`userId` int NOT NULL,
	`activityType` enum('created','updated','submitted') NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_time_entry_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `consultant_time_entry_activities` ADD CONSTRAINT `cte_activity_time_fk` FOREIGN KEY (`timeEntryId`) REFERENCES `timesheet_entries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_time_entry_activities` ADD CONSTRAINT `cte_activity_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
