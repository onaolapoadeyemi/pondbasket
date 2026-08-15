CREATE TABLE `shareEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shareType` enum('catalog','product') NOT NULL,
	`productId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shareEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `share_events_type_created_idx` ON `shareEvents` (`shareType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `share_events_product_created_idx` ON `shareEvents` (`productId`,`createdAt`);