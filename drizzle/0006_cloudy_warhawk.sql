CREATE TABLE `resume_upload_sessions` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`originalFileName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resume_upload_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `resume_upload_sessions` ADD CONSTRAINT `resume_upload_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;