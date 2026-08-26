CREATE TABLE `employee_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`employmentType` varchar(96),
	`workAuthorizationStatus` enum('not_started','details_requested','human_review','verified','expiry_watch') NOT NULL DEFAULT 'not_started',
	`statusNote` varchar(500),
	`expiryDate` timestamp,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `employee_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`onboardingStage` enum('not_started','profile_in_progress','manager_confirmation','ready_for_assignment','assigned') NOT NULL DEFAULT 'not_started',
	`progressPercent` int NOT NULL DEFAULT 0,
	`managerConfirmed` boolean NOT NULL DEFAULT false,
	`projectName` varchar(180),
	`assignmentState` enum('unassigned','pending','active','roll_off') NOT NULL DEFAULT 'unassigned',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `onboarding_assignments_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `employee_profiles` ADD CONSTRAINT `employee_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboarding_assignments` ADD CONSTRAINT `onboarding_assignments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;