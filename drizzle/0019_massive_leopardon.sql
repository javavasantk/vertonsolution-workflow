CREATE TABLE `employee_profile_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`employmentType` varchar(96) NOT NULL,
	`statusNote` varchar(500) NOT NULL,
	`requestState` enum('details_requested') NOT NULL DEFAULT 'details_requested',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_profile_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employee_profile_requests` ADD CONSTRAINT `employee_profile_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;