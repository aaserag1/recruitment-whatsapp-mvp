CREATE TABLE `candidateSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`skill` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidateSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cvFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(2048) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cvFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int,
	`eventType` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`delivered` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `candidateSkills` ADD CONSTRAINT `candidateSkills_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cvFiles` ADD CONSTRAINT `cvFiles_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notificationLogs` ADD CONSTRAINT `notificationLogs_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `candidate_skills_candidate_idx` ON `candidateSkills` (`candidateId`);--> statement-breakpoint
CREATE INDEX `cv_files_candidate_idx` ON `cvFiles` (`candidateId`);--> statement-breakpoint
CREATE INDEX `notification_logs_candidate_idx` ON `notificationLogs` (`candidateId`);--> statement-breakpoint
CREATE INDEX `notification_logs_event_idx` ON `notificationLogs` (`eventType`);