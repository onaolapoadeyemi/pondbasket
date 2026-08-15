import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "customer", "farmer", "admin"])
    .default("customer")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const customerProfiles = mysqlTable("customerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  phone: varchar("phone", { length: 32 }),
  customerType: mysqlEnum("customerType", [
    "individual",
    "household",
    "office",
    "community",
    "event",
    "home_operator",
    "other",
  ])
    .default("individual")
    .notNull(),
  consentAt: timestamp("consentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const customerAddresses = mysqlTable(
  "customerAddresses",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customerId").notNull(),
    state: varchar("state", { length: 80 }).notNull(),
    lga: varchar("lga", { length: 100 }).notNull(),
    serviceZone: varchar("serviceZone", { length: 100 }).notNull(),
    addressLine: text("addressLine").notNull(),
    landmark: varchar("landmark", { length: 255 }).notNull(),
    instructions: text("instructions"),
    isDefault: boolean("isDefault").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("addresses_customer_idx").on(table.customerId)]
);

export const farmerApplications = mysqlTable("farmerApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  legalName: varchar("legalName", { length: 160 }).notNull(),
  farmName: varchar("farmName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }),
  state: varchar("state", { length: 80 }).notNull(),
  lga: varchar("lga", { length: 100 }).notNull(),
  generalFarmArea: varchar("generalFarmArea", { length: 160 }).notNull(),
  zonesJson: json("zonesJson").notNull(),
  speciesJson: json("speciesJson").notNull(),
  weeklyCapacityKg: int("weeklyCapacityKg").notNull(),
  fulfillmentJson: json("fulfillmentJson").notNull(),
  bankName: varchar("bankName", { length: 100 }).notNull(),
  maskedAccountNumber: varchar("maskedAccountNumber", { length: 32 }).notNull(),
  resolvedAccountName: varchar("resolvedAccountName", { length: 160 }),
  status: mysqlEnum("status", [
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "SUSPENDED",
  ])
    .default("DRAFT")
    .notNull(),
  reviewerNote: text("reviewerNote"),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const verificationDocuments = mysqlTable(
  "verificationDocuments",
  {
    id: int("id").autoincrement().primaryKey(),
    farmerApplicationId: int("farmerApplicationId").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    originalName: varchar("originalName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 128 }).notNull(),
    uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  },
  table => [index("documents_application_idx").on(table.farmerApplicationId)]
);

export const serviceZones = mysqlTable("serviceZones", {
  id: int("id").autoincrement().primaryKey(),
  country: varchar("country", { length: 80 }).default("Nigeria").notNull(),
  state: varchar("state", { length: 80 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  lga: varchar("lga", { length: 100 }).notNull(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  deliveryChargeKobo: int("deliveryChargeKobo").notNull(),
  dailyOrderCapacity: int("dailyOrderCapacity").notNull(),
  active: boolean("active").default(true).notNull(),
  windowsJson: json("windowsJson").notNull(),
});

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    farmerApplicationId: int("farmerApplicationId").notNull(),
    species: mysqlEnum("species", ["catfish", "tilapia"]).notNull(),
    form: mysqlEnum("form", ["live", "fresh", "frozen"]).notNull(),
    processing: mysqlEnum("processing", ["whole", "cleaned", "cut"]).notNull(),
    sizeGrade: mysqlEnum("sizeGrade", [
      "small",
      "medium",
      "large",
      "jumbo",
    ]).notNull(),
    unit: mysqlEnum("unit", ["kg", "piece", "batch"]).notNull(),
    unitPriceKobo: int("unitPriceKobo").notNull(),
    minOrder: int("minOrder").notNull(),
    availableQuantity: int("availableQuantity").notNull(),
    reservedQuantity: int("reservedQuantity").default(0).notNull(),
    availabilityType: mysqlEnum("availabilityType", [
      "available_now",
      "scheduled_harvest",
      "preorder",
    ]).notNull(),
    availabilityDate: timestamp("availabilityDate"),
    zonesJson: json("zonesJson").notNull(),
    fulfillmentJson: json("fulfillmentJson").notNull(),
    description: text("description").notNull(),
    status: mysqlEnum("status", [
      "DRAFT",
      "PENDING_APPROVAL",
      "ACTIVE",
      "INACTIVE",
      "REJECTED",
    ])
      .default("DRAFT")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("products_farmer_idx").on(table.farmerApplicationId),
    index("products_species_idx").on(table.species, table.status),
  ]
);

export const productImages = mysqlTable(
  "productImages",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    displayUrl: varchar("displayUrl", { length: 512 }).notNull(),
    position: int("position").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("product_image_slot_unq").on(table.productId, table.position),
  ]
);

export const customerFavorites = mysqlTable(
  "customerFavorites",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customerId").notNull(),
    productId: int("productId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("customer_favorite_unq").on(table.customerId, table.productId),
    index("customer_favorites_customer_idx").on(
      table.customerId,
      table.createdAt
    ),
  ]
);

/**
 * Aggregate sharing signal only. Deliberately excludes user, session, device,
 * IP address, referrer, URL query, and search-query columns.
 */
export const shareEvents = mysqlTable(
  "shareEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    shareType: mysqlEnum("shareType", ["catalog", "product"]).notNull(),
    productId: int("productId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("share_events_type_created_idx").on(table.shareType, table.createdAt),
    index("share_events_product_created_idx").on(
      table.productId,
      table.createdAt
    ),
  ]
);

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    publicCode: varchar("publicCode", { length: 24 }).notNull().unique(),
    customerId: int("customerId").notNull(),
    farmerApplicationId: int("farmerApplicationId").notNull(),
    addressId: int("addressId").notNull(),
    serviceZone: varchar("serviceZone", { length: 100 }).notNull(),
    status: mysqlEnum("status", [
      "DRAFT",
      "PENDING_PAYMENT",
      "PAYMENT_PROCESSING",
      "PAID_PENDING_REVIEW",
      "PAID",
      "FARMER_ACCEPTED",
      "FARMER_REJECTED",
      "PREPARING",
      "READY",
      "DISPATCHED",
      "DELIVERED_PENDING_RELEASE",
      "COMPLETED",
      "CANCELLED",
      "DISPUTED",
      "REFUND_PENDING",
      "REFUNDED",
    ])
      .default("DRAFT")
      .notNull(),
    purpose: mysqlEnum("purpose", [
      "home_meal",
      "office_lunch",
      "weekend_gathering",
      "party",
      "community",
      "freezer",
      "home_operator",
      "other",
    ])
      .default("home_meal")
      .notNull(),
    productId: int("productId").notNull(),
    quantity: int("quantity").notNull(),
    deliveryPinHash: varchar("deliveryPinHash", { length: 255 }),
    pinExpiresAt: timestamp("pinExpiresAt"),
    pinAttempts: int("pinAttempts").default(0).notNull(),
    deliveredAt: timestamp("deliveredAt"),
    idempotencyKey: varchar("idempotencyKey", { length: 128 })
      .notNull()
      .unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("orders_customer_idx").on(table.customerId, table.status),
    index("orders_farmer_idx").on(table.farmerApplicationId, table.status),
  ]
);

export const orderPricingSnapshots = mysqlTable("orderPricingSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  unitPriceKobo: int("unitPriceKobo").notNull(),
  quantity: int("quantity").notNull(),
  subtotalKobo: int("subtotalKobo").notNull(),
  commissionRateBps: int("commissionRateBps").notNull(),
  commissionType: varchar("commissionType", { length: 64 }).notNull(),
  commissionKobo: int("commissionKobo").notNull(),
  deliveryChargeKobo: int("deliveryChargeKobo").notNull(),
  buyerServiceFeeKobo: int("buyerServiceFeeKobo").notNull(),
  buyerTotalKobo: int("buyerTotalKobo").notNull(),
  farmerGrossKobo: int("farmerGrossKobo").notNull(),
  farmerPayoutKobo: int("farmerPayoutKobo").notNull(),
  roundingMethod: varchar("roundingMethod", { length: 64 })
    .default("floor")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orderEvents = mysqlTable(
  "orderEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    actorId: int("actorId"),
    fromState: varchar("fromState", { length: 48 }),
    toState: varchar("toState", { length: 48 }).notNull(),
    reason: text("reason"),
    correlationId: varchar("correlationId", { length: 128 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("order_events_order_idx").on(table.orderId, table.createdAt)]
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    channel: mysqlEnum("channel", ["in_app", "email", "sms", "whatsapp"])
      .default("in_app")
      .notNull(),
    eventType: varchar("eventType", { length: 80 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    body: text("body").notNull(),
    status: mysqlEnum("status", ["PENDING", "SENT", "FAILED", "SIMULATED"])
      .default("PENDING")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    readAt: timestamp("readAt"),
  },
  table => [index("notifications_user_idx").on(table.userId, table.createdAt)]
);

export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  openedByUserId: int("openedByUserId").notNull(),
  reason: varchar("reason", { length: 80 }).notNull(),
  detail: text("detail").notNull(),
  status: mysqlEnum("status", ["OPEN", "UNDER_REVIEW", "RESOLVED"])
    .default("OPEN")
    .notNull(),
  resolution: text("resolution"),
  resolvedByUserId: int("resolvedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export const payouts = mysqlTable("payouts", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  farmerApplicationId: int("farmerApplicationId").notNull(),
  amountKobo: int("amountKobo").notNull(),
  status: mysqlEnum("status", [
    "INELIGIBLE",
    "ELIGIBLE",
    "UNDER_REVIEW",
    "RECORDED",
    "FAILED",
  ])
    .default("INELIGIBLE")
    .notNull(),
  recordedByUserId: int("recordedByUserId"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const featureFlags = mysqlTable("featureFlags", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 80 }).notNull().unique(),
  enabled: boolean("enabled").default(false).notNull(),
  description: text("description").notNull(),
  updatedByUserId: int("updatedByUserId"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const platformSettings = mysqlTable("platformSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  valueJson: json("valueJson").notNull(),
  updatedByUserId: int("updatedByUserId"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const legalAcceptances = mysqlTable(
  "legalAcceptances",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    documentType: varchar("documentType", { length: 100 }).notNull(),
    documentVersion: varchar("documentVersion", { length: 32 }).notNull(),
    acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("legal_acceptance_unq").on(
      table.userId,
      table.documentType,
      table.documentVersion
    ),
  ]
);

export const dataRightsRequests = mysqlTable("dataRightsRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "access",
    "export",
    "correction",
    "deletion",
    "consent_withdrawal",
  ]).notNull(),
  detail: text("detail"),
  status: mysqlEnum("status", ["OPEN", "IN_REVIEW", "CLOSED"])
    .default("OPEN")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
