CREATE TABLE `customerAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`state` varchar(80) NOT NULL,
	`lga` varchar(100) NOT NULL,
	`serviceZone` varchar(100) NOT NULL,
	`addressLine` text NOT NULL,
	`landmark` varchar(255) NOT NULL,
	`instructions` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(32),
	`customerType` enum('individual','household','office','community','event','home_operator','other') NOT NULL DEFAULT 'individual',
	`consentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `dataRightsRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('access','export','correction','deletion','consent_withdrawal') NOT NULL,
	`detail` text,
	`status` enum('OPEN','IN_REVIEW','CLOSED') NOT NULL DEFAULT 'OPEN',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataRightsRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`openedByUserId` int NOT NULL,
	`reason` varchar(80) NOT NULL,
	`detail` text NOT NULL,
	`status` enum('OPEN','UNDER_REVIEW','RESOLVED') NOT NULL DEFAULT 'OPEN',
	`resolution` text,
	`resolvedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`),
	CONSTRAINT `disputes_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `farmerApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`legalName` varchar(160) NOT NULL,
	`farmName` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`email` varchar(320),
	`state` varchar(80) NOT NULL,
	`lga` varchar(100) NOT NULL,
	`generalFarmArea` varchar(160) NOT NULL,
	`zonesJson` json NOT NULL,
	`speciesJson` json NOT NULL,
	`weeklyCapacityKg` int NOT NULL,
	`fulfillmentJson` json NOT NULL,
	`bankName` varchar(100) NOT NULL,
	`maskedAccountNumber` varchar(32) NOT NULL,
	`resolvedAccountName` varchar(160),
	`status` enum('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','SUSPENDED') NOT NULL DEFAULT 'DRAFT',
	`reviewerNote` text,
	`submittedAt` timestamp,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farmerApplications_id` PRIMARY KEY(`id`),
	CONSTRAINT `farmerApplications_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `featureFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(80) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`description` text NOT NULL,
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `featureFlags_id` PRIMARY KEY(`id`),
	CONSTRAINT `featureFlags_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `legalAcceptances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` varchar(100) NOT NULL,
	`documentVersion` varchar(32) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legalAcceptances_id` PRIMARY KEY(`id`),
	CONSTRAINT `legal_acceptance_unq` UNIQUE(`userId`,`documentType`,`documentVersion`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channel` enum('in_app','email','sms','whatsapp') NOT NULL DEFAULT 'in_app',
	`eventType` varchar(80) NOT NULL,
	`title` varchar(160) NOT NULL,
	`body` text NOT NULL,
	`status` enum('PENDING','SENT','FAILED','SIMULATED') NOT NULL DEFAULT 'PENDING',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`actorId` int,
	`fromState` varchar(48),
	`toState` varchar(48) NOT NULL,
	`reason` text,
	`correlationId` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderPricingSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`unitPriceKobo` int NOT NULL,
	`quantity` int NOT NULL,
	`subtotalKobo` int NOT NULL,
	`commissionRateBps` int NOT NULL,
	`commissionType` varchar(64) NOT NULL,
	`commissionKobo` int NOT NULL,
	`deliveryChargeKobo` int NOT NULL,
	`buyerServiceFeeKobo` int NOT NULL,
	`buyerTotalKobo` int NOT NULL,
	`farmerGrossKobo` int NOT NULL,
	`farmerPayoutKobo` int NOT NULL,
	`roundingMethod` varchar(64) NOT NULL DEFAULT 'floor',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderPricingSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `orderPricingSnapshots_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicCode` varchar(24) NOT NULL,
	`customerId` int NOT NULL,
	`farmerApplicationId` int NOT NULL,
	`addressId` int NOT NULL,
	`serviceZone` varchar(100) NOT NULL,
	`status` enum('DRAFT','PENDING_PAYMENT','PAYMENT_PROCESSING','PAID_PENDING_REVIEW','PAID','FARMER_ACCEPTED','FARMER_REJECTED','PREPARING','READY','DISPATCHED','DELIVERED_PENDING_RELEASE','COMPLETED','CANCELLED','DISPUTED','REFUND_PENDING','REFUNDED') NOT NULL DEFAULT 'DRAFT',
	`purpose` enum('home_meal','office_lunch','weekend_gathering','party','community','freezer','home_operator','other') NOT NULL DEFAULT 'home_meal',
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`deliveryPinHash` varchar(255),
	`pinExpiresAt` timestamp,
	`pinAttempts` int NOT NULL DEFAULT 0,
	`deliveredAt` timestamp,
	`idempotencyKey` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_publicCode_unique` UNIQUE(`publicCode`),
	CONSTRAINT `orders_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`farmerApplicationId` int NOT NULL,
	`amountKobo` int NOT NULL,
	`status` enum('INELIGIBLE','ELIGIBLE','UNDER_REVIEW','RECORDED','FAILED') NOT NULL DEFAULT 'INELIGIBLE',
	`recordedByUserId` int,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `payouts_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `productImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`displayUrl` varchar(512) NOT NULL,
	`position` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productImages_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_image_slot_unq` UNIQUE(`productId`,`position`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmerApplicationId` int NOT NULL,
	`species` enum('catfish','tilapia') NOT NULL,
	`form` enum('live','fresh','frozen') NOT NULL,
	`processing` enum('whole','cleaned','cut') NOT NULL,
	`sizeGrade` enum('small','medium','large','jumbo') NOT NULL,
	`unit` enum('kg','piece','batch') NOT NULL,
	`unitPriceKobo` int NOT NULL,
	`minOrder` int NOT NULL,
	`availableQuantity` int NOT NULL,
	`reservedQuantity` int NOT NULL DEFAULT 0,
	`availabilityType` enum('available_now','scheduled_harvest','preorder') NOT NULL,
	`availabilityDate` timestamp,
	`zonesJson` json NOT NULL,
	`fulfillmentJson` json NOT NULL,
	`description` text NOT NULL,
	`status` enum('DRAFT','PENDING_APPROVAL','ACTIVE','INACTIVE','REJECTED') NOT NULL DEFAULT 'DRAFT',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceZones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`country` varchar(80) NOT NULL DEFAULT 'Nigeria',
	`state` varchar(80) NOT NULL,
	`city` varchar(100) NOT NULL,
	`lga` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`deliveryChargeKobo` int NOT NULL,
	`dailyOrderCapacity` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`windowsJson` json NOT NULL,
	CONSTRAINT `serviceZones_id` PRIMARY KEY(`id`),
	CONSTRAINT `serviceZones_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `verificationDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmerApplicationId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verificationDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','customer','farmer','admin') NOT NULL DEFAULT 'customer';--> statement-breakpoint
CREATE INDEX `addresses_customer_idx` ON `customerAddresses` (`customerId`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `order_events_order_idx` ON `orderEvents` (`orderId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customerId`,`status`);--> statement-breakpoint
CREATE INDEX `orders_farmer_idx` ON `orders` (`farmerApplicationId`,`status`);--> statement-breakpoint
CREATE INDEX `products_farmer_idx` ON `products` (`farmerApplicationId`);--> statement-breakpoint
CREATE INDEX `products_species_idx` ON `products` (`species`,`status`);--> statement-breakpoint
CREATE INDEX `documents_application_idx` ON `verificationDocuments` (`farmerApplicationId`);