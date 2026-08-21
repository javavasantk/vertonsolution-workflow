CREATE TABLE `catalog_courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`type` enum('workshop','course','bootcamp','project') NOT NULL,
	`title` varchar(240) NOT NULL,
	`tagline` text NOT NULL,
	`description` text NOT NULL,
	`duration` varchar(80) NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced','all') NOT NULL,
	`domainsJson` text NOT NULL,
	`status` enum('open','upcoming','application','active') NOT NULL,
	`requiredTier` int NOT NULL DEFAULT 0,
	`contentJson` text NOT NULL,
	`published` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `catalog_courses_type_idx` ON `catalog_courses` (`type`);--> statement-breakpoint
CREATE INDEX `catalog_courses_difficulty_idx` ON `catalog_courses` (`difficulty`);