CREATE TABLE `consultant_engagement_continuity_note_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`continuityNoteId` int NOT NULL,
	`userId` int NOT NULL,
	`activityType` enum('submitted') NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_engagement_continuity_note_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultant_engagement_continuity_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`userId` int NOT NULL,
	`category` enum('handoff_context','work_status','support_needed') NOT NULL,
	`factualNote` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultant_engagement_continuity_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `consultant_engagement_continuity_note_activities` ADD CONSTRAINT `cecn_act_note_fk` FOREIGN KEY (`continuityNoteId`) REFERENCES `consultant_engagement_continuity_notes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_engagement_continuity_note_activities` ADD CONSTRAINT `cecn_act_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_engagement_continuity_notes` ADD CONSTRAINT `cecn_assignment_fk` FOREIGN KEY (`assignmentId`) REFERENCES `consultant_assignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultant_engagement_continuity_notes` ADD CONSTRAINT `cecn_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
