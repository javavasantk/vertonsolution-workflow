CREATE TABLE `consultant_timesheet_evidence_discrepancy_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewerNoteId` int NOT NULL,
	`evidenceId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`body` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_timesheet_evidence_discrepancy_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `ts_note_response_uq` UNIQUE(`reviewerNoteId`,`authorUserId`)
);
--> statement-breakpoint
CREATE TABLE `consultant_timesheet_evidence_note_acknowledgements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewerNoteId` int NOT NULL,
	`evidenceId` int NOT NULL,
	`userId` int NOT NULL,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_timesheet_evidence_note_acknowledgements_id` PRIMARY KEY(`id`),
	CONSTRAINT `ts_note_ack_uq` UNIQUE(`reviewerNoteId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `consultant_timesheet_evidence_response_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceId` int NOT NULL,
	`userId` int NOT NULL,
	`reviewerNoteId` int NOT NULL,
	`activityType` enum('discrepancy_acknowledged','discrepancy_response_submitted') NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_timesheet_evidence_response_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_discrepancy_responses` ADD CONSTRAINT `ts_resp_note_fk` FOREIGN KEY (`reviewerNoteId`) REFERENCES `consultant_timesheet_evidence_discrepancy_notes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_discrepancy_responses` ADD CONSTRAINT `ts_resp_evidence_fk` FOREIGN KEY (`evidenceId`) REFERENCES `consultant_timesheet_evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_discrepancy_responses` ADD CONSTRAINT `ts_resp_author_fk` FOREIGN KEY (`authorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_note_acknowledgements` ADD CONSTRAINT `ts_ack_note_fk` FOREIGN KEY (`reviewerNoteId`) REFERENCES `consultant_timesheet_evidence_discrepancy_notes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_note_acknowledgements` ADD CONSTRAINT `ts_ack_evidence_fk` FOREIGN KEY (`evidenceId`) REFERENCES `consultant_timesheet_evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_note_acknowledgements` ADD CONSTRAINT `ts_ack_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_response_activities` ADD CONSTRAINT `ts_resp_act_evidence_fk` FOREIGN KEY (`evidenceId`) REFERENCES `consultant_timesheet_evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_response_activities` ADD CONSTRAINT `ts_resp_act_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_response_activities` ADD CONSTRAINT `ts_resp_act_note_fk` FOREIGN KEY (`reviewerNoteId`) REFERENCES `consultant_timesheet_evidence_discrepancy_notes`(`id`) ON DELETE no action ON UPDATE no action;
