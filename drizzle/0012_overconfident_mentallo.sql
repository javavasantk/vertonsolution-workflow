CREATE TABLE `consultant_timesheet_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadSessionId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`timeEntryId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`originalFileName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` int NOT NULL,
	`fileSha256` varchar(64) NOT NULL,
	`extractionStatus` enum('extracted','needs_human_review') NOT NULL DEFAULT 'needs_human_review',
	`extractedHours` int,
	`extractionConfidence` enum('high','medium','low') NOT NULL DEFAULT 'low',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultant_timesheet_evidence_id` PRIMARY KEY(`id`),
	CONSTRAINT `consultant_timesheet_evidence_session_uq` UNIQUE(`uploadSessionId`),
	CONSTRAINT `consultant_timesheet_evidence_file_uq` UNIQUE(`userId`,`timeEntryId`,`fileSha256`)
);
--> statement-breakpoint
CREATE TABLE `consultant_timesheet_evidence_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceId` int NOT NULL,
	`userId` int NOT NULL,
	`activityType` enum('uploaded','hours_extracted','needs_human_review') NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_timesheet_evidence_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultant_timesheet_upload_sessions` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`timeEntryId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`originalFileName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_timesheet_upload_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence` ADD CONSTRAINT `consultant_timesheet_evidence_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence` ADD CONSTRAINT `cts_evidence_time_fk` FOREIGN KEY (`timeEntryId`) REFERENCES `timesheet_entries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_activities` ADD CONSTRAINT `cts_evidence_activity_ev_fk` FOREIGN KEY (`evidenceId`) REFERENCES `consultant_timesheet_evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_activities` ADD CONSTRAINT `cts_evidence_activity_usr_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_upload_sessions` ADD CONSTRAINT `cts_upload_session_usr_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_upload_sessions` ADD CONSTRAINT `cts_upload_session_time_fk` FOREIGN KEY (`timeEntryId`) REFERENCES `timesheet_entries`(`id`) ON DELETE no action ON UPDATE no action;
