CREATE TABLE `access_role_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`changedByUserId` int NOT NULL,
	`previousRole` varchar(64) NOT NULL,
	`nextRole` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_role_changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `access_role_changes` ADD CONSTRAINT `access_role_changes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `access_role_changes` ADD CONSTRAINT `access_role_changes_changedByUserId_users_id_fk` FOREIGN KEY (`changedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;