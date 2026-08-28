CREATE TABLE `consultant_action_inbox_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dedupKey` varchar(160) NOT NULL,
	`state` enum('unread','read','dismissed') NOT NULL DEFAULT 'unread',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultant_action_inbox_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `consultant_inbox_user_dedup_uq` UNIQUE(`userId`,`dedupKey`)
);
--> statement-breakpoint
ALTER TABLE `consultant_action_inbox_states` ADD CONSTRAINT `consultant_action_inbox_states_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;