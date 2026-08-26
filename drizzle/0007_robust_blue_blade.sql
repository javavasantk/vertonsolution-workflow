CREATE TABLE `client_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demoKey` varchar(96) NOT NULL,
	`name` varchar(255) NOT NULL,
	`industry` varchar(128),
	`location` varchar(180),
	`primaryContact` varchar(255),
	`status` enum('prospect','active','paused') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_accounts_demoKey_unique` UNIQUE(`demoKey`)
);
--> statement-breakpoint
CREATE TABLE `client_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demoKey` varchar(96) NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`technologyStackJson` text NOT NULL,
	`deliveryStatus` enum('planned','active','at_risk','closing') NOT NULL DEFAULT 'planned',
	`projectManagerName` varchar(255),
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_projects_demoKey_unique` UNIQUE(`demoKey`)
);
--> statement-breakpoint
CREATE TABLE `consultant_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demoKey` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`clientId` int NOT NULL,
	`projectId` int NOT NULL,
	`managerName` varchar(255),
	`allocationPercent` int NOT NULL DEFAULT 100,
	`assignmentState` enum('pending','active','extension_due','roll_off','bench') NOT NULL DEFAULT 'pending',
	`startDate` timestamp,
	`endDate` timestamp,
	`billable` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultant_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `consultant_assignments_demoKey_unique` UNIQUE(`demoKey`)
);
--> statement-breakpoint
CREATE TABLE `operational_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demoKey` varchar(96) NOT NULL,
	`entityType` varchar(96) NOT NULL,
	`title` varchar(255) NOT NULL,
	`detail` varchar(500),
	`activityState` enum('open','attention','complete') NOT NULL DEFAULT 'open',
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operational_activities_id` PRIMARY KEY(`id`),
	CONSTRAINT `operational_activities_demoKey_unique` UNIQUE(`demoKey`)
);
--> statement-breakpoint
CREATE TABLE `staffing_demands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demoKey` varchar(96) NOT NULL,
	`clientId` int NOT NULL,
	`projectId` int,
	`title` varchar(255) NOT NULL,
	`skillsJson` text NOT NULL,
	`openings` int NOT NULL DEFAULT 1,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('open','submitted','filled','on_hold') NOT NULL DEFAULT 'open',
	`targetDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffing_demands_id` PRIMARY KEY(`id`),
	CONSTRAINT `staffing_demands_demoKey_unique` UNIQUE(`demoKey`)
);
--> statement-breakpoint
CREATE TABLE `timesheet_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demoKey` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`assignmentId` int,
	`weekEnding` timestamp NOT NULL,
	`hours` int NOT NULL DEFAULT 0,
	`status` enum('draft','submitted','approved','exception') NOT NULL DEFAULT 'draft',
	`note` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timesheet_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `timesheet_entries_demoKey_unique` UNIQUE(`demoKey`)
);
--> statement-breakpoint
ALTER TABLE `client_projects` ADD CONSTRAINT `client_projects_clientId_client_accounts_id_fk` FOREIGN KEY (`clientId`) REFERENCES `client_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_assignments` ADD CONSTRAINT `consultant_assignments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_assignments` ADD CONSTRAINT `consultant_assignments_clientId_client_accounts_id_fk` FOREIGN KEY (`clientId`) REFERENCES `client_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_assignments` ADD CONSTRAINT `consultant_assignments_projectId_client_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `client_projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staffing_demands` ADD CONSTRAINT `staffing_demands_clientId_client_accounts_id_fk` FOREIGN KEY (`clientId`) REFERENCES `client_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staffing_demands` ADD CONSTRAINT `staffing_demands_projectId_client_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `client_projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timesheet_entries` ADD CONSTRAINT `timesheet_entries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timesheet_entries` ADD CONSTRAINT `timesheet_entries_assignmentId_consultant_assignments_id_fk` FOREIGN KEY (`assignmentId`) REFERENCES `consultant_assignments`(`id`) ON DELETE no action ON UPDATE no action;