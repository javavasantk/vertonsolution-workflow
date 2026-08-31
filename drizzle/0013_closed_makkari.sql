CREATE TABLE `consultant_timesheet_evidence_discrepancy_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`note` varchar(1000) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_timesheet_evidence_discrepancy_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultant_timesheet_evidence_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceId` int NOT NULL,
	`reviewerUserId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultant_timesheet_evidence_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `consultant_timesheet_evidence_review_uq` UNIQUE(`evidenceId`)
);
--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_discrepancy_notes` ADD CONSTRAINT `ctse_note_ev_fk` FOREIGN KEY (`evidenceId`) REFERENCES `consultant_timesheet_evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_discrepancy_notes` ADD CONSTRAINT `ctse_note_usr_fk` FOREIGN KEY (`authorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_reviews` ADD CONSTRAINT `ctse_review_ev_fk` FOREIGN KEY (`evidenceId`) REFERENCES `consultant_timesheet_evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_timesheet_evidence_reviews` ADD CONSTRAINT `ctse_review_usr_fk` FOREIGN KEY (`reviewerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
