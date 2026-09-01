CREATE TABLE `employee_profile_update_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`activityType` enum('requested') NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_profile_update_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employee_profile_update_activities` ADD CONSTRAINT `employee_profile_update_activities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;