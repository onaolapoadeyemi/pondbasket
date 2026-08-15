CREATE TABLE `campaignConversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignTokenHash` varchar(64) NOT NULL,
	`productId` int NOT NULL,
	`convertedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignConversions_id` PRIMARY KEY(`id`),
	CONSTRAINT `campaignConversions_campaignTokenHash_unique` UNIQUE(`campaignTokenHash`)
);
--> statement-breakpoint
CREATE TABLE `orderCampaignAttributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`campaignTokenHash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderCampaignAttributions_id` PRIMARY KEY(`id`),
	CONSTRAINT `orderCampaignAttributions_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
ALTER TABLE `shareEvents` ADD `campaignTokenHash` varchar(64);--> statement-breakpoint
CREATE INDEX `campaign_conversions_product_idx` ON `campaignConversions` (`productId`,`convertedAt`);--> statement-breakpoint
CREATE INDEX `order_campaign_attributions_campaign_idx` ON `orderCampaignAttributions` (`campaignTokenHash`);--> statement-breakpoint
CREATE INDEX `share_events_campaign_idx` ON `shareEvents` (`campaignTokenHash`);