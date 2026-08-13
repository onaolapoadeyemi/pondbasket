CREATE TABLE `customerFavorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`productId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerFavorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_favorite_unq` UNIQUE(`customerId`,`productId`)
);
--> statement-breakpoint
CREATE INDEX `customer_favorites_customer_idx` ON `customerFavorites` (`customerId`,`createdAt`);