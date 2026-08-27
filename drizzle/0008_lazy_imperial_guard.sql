CREATE TABLE `consultant_onboarding_task_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`userId` int NOT NULL,
	`activityType` enum('acknowledged') NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_onboarding_task_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultant_onboarding_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demoKey` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`taskType` enum('profile','policy','equipment_access','orientation') NOT NULL,
	`description` varchar(500) NOT NULL,
	`ownerGroup` enum('consultant','hr','it','manager') NOT NULL,
	`dueDate` timestamp,
	`consultantCompletionState` enum('pending','acknowledged') NOT NULL DEFAULT 'pending',
	`acknowledgedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultant_onboarding_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `consultant_onboarding_tasks_demoKey_unique` UNIQUE(`demoKey`)
);
--> statement-breakpoint
ALTER TABLE `consultant_onboarding_task_activities` ADD CONSTRAINT `cot_act_task_fk` FOREIGN KEY (`taskId`) REFERENCES `consultant_onboarding_tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_onboarding_task_activities` ADD CONSTRAINT `cot_act_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_onboarding_tasks` ADD CONSTRAINT `cot_task_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
