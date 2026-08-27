CREATE TABLE `consultant_check_in_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkInId` int NOT NULL,
	`userId` int NOT NULL,
	`activityType` enum('submitted') NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_check_in_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultant_check_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('engagement_update','work_update','support_note') NOT NULL,
	`factualNote` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_check_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `consultant_check_in_activities` ADD CONSTRAINT `checkin_act_checkin_fk` FOREIGN KEY (`checkInId`) REFERENCES `consultant_check_ins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_check_in_activities` ADD CONSTRAINT `checkin_act_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_check_ins` ADD CONSTRAINT `checkin_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
