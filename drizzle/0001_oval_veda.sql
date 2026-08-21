CREATE TABLE `aeroforge_trials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` varchar(64) NOT NULL,
	`challengeName` varchar(160) NOT NULL,
	`label` varchar(160),
	`mach` decimal(5,3) NOT NULL,
	`alphaDeg` decimal(5,2) NOT NULL,
	`altitudeKm` decimal(6,2) NOT NULL,
	`liftCoefficient` decimal(8,4) NOT NULL,
	`dragCoefficient` decimal(8,5) NOT NULL,
	`liftToDrag` decimal(8,2) NOT NULL,
	`trueAirspeedKmh` decimal(8,1) NOT NULL,
	`reynolds` decimal(14,0),
	`benchmarkDelta` decimal(6,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aeroforge_trials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `backlog_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`squad` varchar(120),
	`status` enum('todo','in_progress','review','done') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `backlog_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`programType` varchar(48) NOT NULL,
	`credentialCode` varchar(64) NOT NULL,
	`verified` boolean NOT NULL DEFAULT true,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `copilot_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `copilot_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`catalogSlug` varchar(120) NOT NULL,
	`catalogTitle` varchar(240) NOT NULL,
	`catalogType` varchar(32) NOT NULL,
	`progressPercent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('school','contact') NOT NULL DEFAULT 'contact',
	`name` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`organisation` varchar(240),
	`topic` varchar(160),
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`subscriptionId` int,
	`planId` varchar(32) NOT NULL,
	`razorpayOrderId` varchar(128) NOT NULL,
	`razorpayPaymentId` varchar(128),
	`razorpaySignature` varchar(255),
	`amountPaise` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'INR',
	`status` enum('created','paid','failed','refunded') NOT NULL DEFAULT 'created',
	`method` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` varchar(32) NOT NULL,
	`status` enum('created','active','cancelled','expired','failed') NOT NULL DEFAULT 'created',
	`amountPaise` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'INR',
	`billingCycle` enum('none','monthly','yearly') NOT NULL DEFAULT 'none',
	`razorpayOrderId` varchar(128),
	`razorpayPaymentId` varchar(128),
	`razorpaySubscriptionId` varchar(128),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `planId` varchar(32) DEFAULT 'explorer' NOT NULL;--> statement-breakpoint
CREATE INDEX `trials_userId_idx` ON `aeroforge_trials` (`userId`);--> statement-breakpoint
CREATE INDEX `backlog_userId_idx` ON `backlog_items` (`userId`);--> statement-breakpoint
CREATE INDEX `certificates_userId_idx` ON `certificates` (`userId`);--> statement-breakpoint
CREATE INDEX `copilot_userId_idx` ON `copilot_messages` (`userId`);--> statement-breakpoint
CREATE INDEX `enrollments_userId_idx` ON `enrollments` (`userId`);--> statement-breakpoint
CREATE INDEX `payments_userId_idx` ON `payments` (`userId`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`razorpayOrderId`);--> statement-breakpoint
CREATE INDEX `subscriptions_userId_idx` ON `subscriptions` (`userId`);--> statement-breakpoint
CREATE INDEX `subscriptions_order_idx` ON `subscriptions` (`razorpayOrderId`);