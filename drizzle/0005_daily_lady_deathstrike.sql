CREATE TABLE `candidate_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdByUserId` int NOT NULL,
	`candidateName` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(96),
	`location` varchar(255),
	`professionalSummary` text,
	`yearsExperience` varchar(96),
	`skillsJson` text NOT NULL,
	`recentRolesJson` text NOT NULL,
	`educationJson` text NOT NULL,
	`recruiterNotesJson` text NOT NULL,
	`confidence` enum('high','medium','low') NOT NULL DEFAULT 'low',
	`reviewState` enum('pending_human_review','reviewed','archived') NOT NULL DEFAULT 'pending_human_review',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidate_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resume_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateProfileId` int NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`originalFileName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resume_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `candidate_profiles` ADD CONSTRAINT `candidate_profiles_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resume_uploads` ADD CONSTRAINT `resume_uploads_candidateProfileId_candidate_profiles_id_fk` FOREIGN KEY (`candidateProfileId`) REFERENCES `candidate_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resume_uploads` ADD CONSTRAINT `resume_uploads_uploadedByUserId_users_id_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;