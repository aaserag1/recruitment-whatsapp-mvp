CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`preferredLocation` varchar(180) NOT NULL,
	`currentSalary` int NOT NULL,
	`expectedSalary` int NOT NULL,
	`yearsExperience` int NOT NULL,
	`noticePeriodDays` int NOT NULL,
	`desiredJobTitle` varchar(180) NOT NULL,
	`cvFileKey` varchar(512),
	`cvFileName` varchar(255),
	`cvFileUrl` varchar(2048),
	`cvMimeType` varchar(128),
	`extractionStatus` enum('not_requested','processing','completed','failed') NOT NULL DEFAULT 'not_requested',
	`extractedTitle` varchar(180),
	`extractedExperienceYears` int,
	`skillsJson` text,
	`status` enum('new','reviewing','matched','contacted') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobMatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`score` int NOT NULL,
	`reasonsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobMatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`location` varchar(180) NOT NULL,
	`salaryMin` int NOT NULL,
	`salaryMax` int NOT NULL,
	`description` text NOT NULL,
	`applicationUrl` varchar(2048) NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `jobMatches` ADD CONSTRAINT `jobMatches_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobMatches` ADD CONSTRAINT `jobMatches_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `candidates_status_idx` ON `candidates` (`status`);--> statement-breakpoint
CREATE INDEX `candidates_location_idx` ON `candidates` (`preferredLocation`);--> statement-breakpoint
CREATE INDEX `candidates_created_idx` ON `candidates` (`createdAt`);--> statement-breakpoint
CREATE INDEX `job_matches_candidate_idx` ON `jobMatches` (`candidateId`);--> statement-breakpoint
CREATE INDEX `job_matches_job_idx` ON `jobMatches` (`jobId`);--> statement-breakpoint
CREATE INDEX `jobs_status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `jobs_location_idx` ON `jobs` (`location`);