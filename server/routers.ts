import crypto from "node:crypto";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  campaignConversions,
  customerAddresses,
  customerFavorites,
  customerProfiles,
  dataRightsRequests,
  disputes,
  farmerApplications,
  featureFlags,
  notifications,
  orderEvents,
  orderCampaignAttributions,
  orderPricingSnapshots,
  orders,
  payouts,
  platformSettings,
  productImages,
  products,
  shareEvents,
  serviceZones,
  users,
  verificationDocuments,
} from "../drizzle/schema";
import { BRAND, PRODUCT_SPECIES } from "../shared/brand";
import {
  assertOrderTransition,
  calculatePricing,
  maskBankAccount,
  type OrderState,
} from "../shared/domain";
import { canSaveFavorite, favoriteToggleOutcome } from "../shared/favorites";
import {
  buildDailyShareTrend,
  buildMonthlyShareTrend,
} from "../shared/shareTrends";
import { getDb } from "./db";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import { demoCatalog, demoNotifications } from "./modules/demoData";
import { storagePut } from "./storage";

const orderStateSchema = z.enum([
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
]);
const farmerStateSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
]);

function money(value: number) {
  if (!Number.isInteger(value) || value < 0)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Money must be a non-negative integer number of kobo.",
    });
  return value;
}

function correlation() {
  return crypto.randomUUID();
}

function hashPin(pin: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pin, salt, 32).toString("hex")}`;
}

function hashCampaignToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function verifyPin(pin: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(pin, salt, 32).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(actual, "hex"),
    Buffer.from(expected, "hex")
  );
}

async function ensureCustomerProfile(userId: number) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is unavailable.",
    });
  const existing = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];
  await db
    .insert(customerProfiles)
    .values({ userId, customerType: "individual", consentAt: new Date() });
  const created = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, userId))
    .limit(1);
  return created[0]!;
}

async function appendOrderEvent(
  orderId: number,
  actorId: number | null,
  fromState: string | null,
  toState: string,
  reason: string | null
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(orderEvents).values({
    orderId,
    actorId,
    fromState,
    toState,
    reason,
    correlationId: correlation(),
  });
}

async function simulateNotification(
  userId: number,
  eventType: string,
  title: string,
  body: string
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({
    userId,
    eventType,
    title,
    body,
    channel: "in_app",
    status: "SIMULATED",
  });
  // Email delivery deliberately remains simulated until a configured provider is enabled in Production Mode.
  await db.insert(notifications).values({
    userId,
    eventType,
    title,
    body,
    channel: "email",
    status: "SIMULATED",
  });
}

type CommerceConfig = {
  foundingCommissionBps: number;
  standardCommissionBps: number;
  managedFulfillmentCommissionBps: number;
  buyerServiceFeeEnabled: boolean;
  buyerServiceFeeKobo: number;
};

async function getCommerceConfig(): Promise<CommerceConfig> {
  const fallback = BRAND.commerceDefaults as CommerceConfig;
  const db = await getDb();
  if (!db) return fallback;
  const row = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, "commerce"))
    .limit(1);
  const persisted = row[0]?.valueJson;
  if (!persisted || typeof persisted !== "object" || Array.isArray(persisted))
    return fallback;
  return { ...fallback, ...(persisted as Partial<CommerceConfig>) };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
      return { success: true } as const;
    }),
  }),
  brand: publicProcedure.query(() => BRAND),
  catalog: router({
    list: publicProcedure
      .input(
        z
          .object({
            zone: z.string().optional(),
            species: z.enum(PRODUCT_SPECIES).optional(),
            form: z.enum(["live", "fresh", "frozen"]).optional(),
            processing: z.enum(["whole", "cleaned", "cut"]).optional(),
            size: z.enum(["small", "medium", "large", "jumbo"]).optional(),
            availability: z
              .enum(["available_now", "scheduled_harvest", "preorder"])
              .optional(),
            fulfillment: z
              .enum(["pickup", "farmer_delivery", "platform_delivery"])
              .optional(),
            maxPriceKobo: z.number().int().positive().optional(),
            verifiedOnly: z.boolean().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const db = await getDb();
        const liveProducts = db
          ? await db
              .select()
              .from(products)
              .where(eq(products.status, "ACTIVE"))
          : [];
        const applications = db
          ? await db
              .select()
              .from(farmerApplications)
              .where(eq(farmerApplications.status, "APPROVED"))
          : [];
        const uploadedImages =
          db && liveProducts.length
            ? await db.select().from(productImages)
            : [];
        const applicationById = new Map(
          applications.map(application => [application.id, application])
        );
        const imageUrlsByProduct = new Map<number, string[]>();
        uploadedImages.forEach(image => {
          const urls = imageUrlsByProduct.get(image.productId) ?? [];
          urls.push(image.displayUrl);
          imageUrlsByProduct.set(image.productId, urls);
        });
        const records = liveProducts.length
          ? liveProducts.map(item => {
              const farm = applicationById.get(item.farmerApplicationId);
              return {
                id: item.id,
                farmerId: item.farmerApplicationId,
                farmer: farm?.farmName ?? "Verified PondBasket farm",
                farmerArea: farm?.generalFarmArea ?? "Configured service area",
                verified: true,
                species: item.species,
                form: item.form,
                processing: item.processing,
                sizeGrade: item.sizeGrade,
                unit: item.unit,
                unitPriceKobo: item.unitPriceKobo,
                minOrder: item.minOrder,
                availableQuantity: Math.max(
                  0,
                  item.availableQuantity - item.reservedQuantity
                ),
                availabilityType: item.availabilityType,
                availabilityDate: item.availabilityDate
                  ? item.availabilityDate.toLocaleDateString()
                  : item.availabilityType === "available_now"
                    ? "Available now"
                    : item.availabilityType.replaceAll("_", " "),
                zones: asStringArray(item.zonesJson),
                fulfillment: asStringArray(item.fulfillmentJson),
                description: item.description,
                accent: item.species === "catfish" ? "pond" : "leaf",
                imageUrls: imageUrlsByProduct.get(item.id) ?? [],
              };
            })
          : demoCatalog;
        const filtered = records.filter(
          item =>
            (!input?.zone || item.zones.includes(input.zone)) &&
            (!input?.species || item.species === input.species) &&
            (!input?.form || item.form === input.form) &&
            (!input?.processing || item.processing === input.processing) &&
            (!input?.size || item.sizeGrade === input.size) &&
            (!input?.availability ||
              item.availabilityType === input.availability) &&
            (!input?.fulfillment ||
              item.fulfillment.includes(input.fulfillment)) &&
            (!input?.maxPriceKobo ||
              item.unitPriceKobo <= input.maxPriceKobo) &&
            (!input?.verifiedOnly || item.verified)
        );
        return {
          items: filtered,
          source: "demo" as const,
          lastUpdated: new Date(),
        };
      }),
    quote: publicProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().positive(),
          zone: z.string().min(1),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        const live = db
          ? await db
              .select()
              .from(products)
              .where(
                and(
                  eq(products.id, input.productId),
                  eq(products.status, "ACTIVE")
                )
              )
              .limit(1)
          : [];
        const product = live[0]
          ? {
              ...live[0],
              zones: asStringArray(live[0].zonesJson),
              fulfillment: asStringArray(live[0].fulfillmentJson),
            }
          : demoCatalog.find(
              item =>
                item.id === input.productId && item.zones.includes(input.zone)
            );
        if (!product)
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "This product is not available in the selected service zone.",
          });
        if (!product.zones.includes(input.zone))
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "This product is not available in the selected service zone.",
          });
        if (input.quantity < product.minOrder)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Minimum order is ${product.minOrder} ${product.unit}.`,
          });
        const commerce = await getCommerceConfig();
        const buyerServiceFeeKobo = commerce.buyerServiceFeeEnabled
          ? commerce.buyerServiceFeeKobo
          : 0;
        return {
          product,
          pricing: calculatePricing({
            unitPriceKobo: product.unitPriceKobo,
            quantity: input.quantity,
            commissionRateBps: commerce.foundingCommissionBps,
            deliveryChargeKobo: 130000,
            buyerServiceFeeKobo,
          }),
          feeDisclosure: BRAND.feeLanguage,
        };
      }),
  }),
  analytics: router({
    recordShare: publicProcedure
      .input(
        z.discriminatedUnion("shareType", [
          z.object({ shareType: z.literal("catalog") }),
          z.object({
            shareType: z.literal("product"),
            productId: z.number().int().positive(),
            campaignToken: z.string().uuid().optional(),
          }),
        ])
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { recorded: false };
        await db.insert(shareEvents).values({
          shareType: input.shareType,
          ...(input.shareType === "product"
            ? { productId: input.productId }
            : {}),
          ...(input.shareType === "product" && input.campaignToken
            ? { campaignTokenHash: hashCampaignToken(input.campaignToken) }
            : {}),
        });
        return { recorded: true };
      }),
  }),
  customer: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      const profile = await ensureCustomerProfile(ctx.user.id);
      const db = await getDb();
      const addresses = db
        ? await db
            .select()
            .from(customerAddresses)
            .where(eq(customerAddresses.customerId, profile.id))
        : [];
      return { profile, addresses };
    }),
    saveProfile: protectedProcedure
      .input(
        z.object({
          phone: z.string().min(7).max(32),
          customerType: z.enum([
            "individual",
            "household",
            "office",
            "community",
            "event",
            "home_operator",
            "other",
          ]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await ensureCustomerProfile(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .update(customerProfiles)
          .set({
            phone: input.phone,
            customerType: input.customerType,
            consentAt: new Date(),
          })
          .where(eq(customerProfiles.id, profile.id));
        return { success: true };
      }),
    saveAddress: protectedProcedure
      .input(
        z.object({
          state: z.string().min(2).max(80),
          lga: z.string().min(2).max(100),
          serviceZone: z.string().min(2).max(100),
          addressLine: z.string().min(8).max(500),
          landmark: z.string().min(2).max(255),
          instructions: z.string().max(500).optional(),
          isDefault: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await ensureCustomerProfile(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        if (input.isDefault)
          await db
            .update(customerAddresses)
            .set({ isDefault: false })
            .where(eq(customerAddresses.customerId, profile.id));
        await db.insert(customerAddresses).values({
          customerId: profile.id,
          ...input,
          isDefault: input.isDefault ?? false,
        });
        return { success: true };
      }),
    requestDataRight: protectedProcedure
      .input(
        z.object({
          type: z.enum([
            "access",
            "export",
            "correction",
            "deletion",
            "consent_withdrawal",
          ]),
          detail: z.string().max(800).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .insert(dataRightsRequests)
          .values({ userId: ctx.user.id, ...input });
        return { success: true };
      }),
    favoriteIds: protectedProcedure.query(async ({ ctx }) => {
      const profile = await ensureCustomerProfile(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const saved = await db
        .select({ productId: customerFavorites.productId })
        .from(customerFavorites)
        .where(eq(customerFavorites.customerId, profile.id));
      return saved.map(item => item.productId);
    }),
    favorites: protectedProcedure.query(async ({ ctx }) => {
      const profile = await ensureCustomerProfile(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const saved = await db
        .select()
        .from(customerFavorites)
        .where(eq(customerFavorites.customerId, profile.id))
        .orderBy(desc(customerFavorites.createdAt));
      if (!saved.length) return { items: [] };
      const liveProducts = await db
        .select()
        .from(products)
        .where(eq(products.status, "ACTIVE"));
      const applications = await db
        .select()
        .from(farmerApplications)
        .where(eq(farmerApplications.status, "APPROVED"));
      const uploadedImages = liveProducts.length
        ? await db.select().from(productImages)
        : [];
      const applicationById = new Map(
        applications.map(application => [application.id, application])
      );
      const imageUrlsByProduct = new Map<number, string[]>();
      uploadedImages.forEach(image => {
        const urls = imageUrlsByProduct.get(image.productId) ?? [];
        urls.push(image.displayUrl);
        imageUrlsByProduct.set(image.productId, urls);
      });
      const productById = new Map(liveProducts.map(item => [item.id, item]));
      const items = saved.flatMap(savedItem => {
        const item = productById.get(savedItem.productId);
        if (item) {
          const farm = applicationById.get(item.farmerApplicationId);
          return [
            {
              id: item.id,
              farmerId: item.farmerApplicationId,
              farmer: farm?.farmName ?? "Verified PondBasket farm",
              farmerArea: farm?.generalFarmArea ?? "Configured service area",
              verified: true,
              species: item.species,
              form: item.form,
              processing: item.processing,
              sizeGrade: item.sizeGrade,
              unit: item.unit,
              unitPriceKobo: item.unitPriceKobo,
              minOrder: item.minOrder,
              availableQuantity: Math.max(
                0,
                item.availableQuantity - item.reservedQuantity
              ),
              availabilityType: item.availabilityType,
              availabilityDate: item.availabilityDate
                ? item.availabilityDate.toLocaleDateString()
                : item.availabilityType === "available_now"
                  ? "Available now"
                  : item.availabilityType.replaceAll("_", " "),
              zones: asStringArray(item.zonesJson),
              fulfillment: asStringArray(item.fulfillmentJson),
              description: item.description,
              accent: item.species === "catfish" ? "pond" : "leaf",
              imageUrls: imageUrlsByProduct.get(item.id) ?? [],
            },
          ];
        }
        const demo = demoCatalog.find(
          product => product.id === savedItem.productId
        );
        return demo ? [demo] : [];
      });
      return { items };
    }),
    toggleFavorite: protectedProcedure
      .input(z.object({ productId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await ensureCustomerProfile(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const live = await db
          .select({ id: products.id })
          .from(products)
          .where(
            and(eq(products.id, input.productId), eq(products.status, "ACTIVE"))
          )
          .limit(1);
        if (
          !canSaveFavorite(
            input.productId,
            live.map(product => product.id),
            demoCatalog.map(product => product.id)
          )
        )
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This listing is no longer available to save.",
          });
        const existing = await db
          .select({ id: customerFavorites.id })
          .from(customerFavorites)
          .where(
            and(
              eq(customerFavorites.customerId, profile.id),
              eq(customerFavorites.productId, input.productId)
            )
          )
          .limit(1);
        const outcome = favoriteToggleOutcome(existing[0]?.id);
        if (!outcome.saved) {
          await db
            .delete(customerFavorites)
            .where(eq(customerFavorites.id, outcome.removeId));
          return { saved: false };
        }
        await db
          .insert(customerFavorites)
          .values({ customerId: profile.id, productId: input.productId });
        return { saved: true };
      }),
  }),
  farmer: router({
    application: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const application = await db
        .select()
        .from(farmerApplications)
        .where(eq(farmerApplications.userId, ctx.user.id))
        .limit(1);
      return application[0] ?? null;
    }),
    documents: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const application = await db
        .select()
        .from(farmerApplications)
        .where(eq(farmerApplications.userId, ctx.user.id))
        .limit(1);
      if (!application[0]) return [];
      return db
        .select({
          id: verificationDocuments.id,
          originalName: verificationDocuments.originalName,
          mimeType: verificationDocuments.mimeType,
          uploadedAt: verificationDocuments.uploadedAt,
        })
        .from(verificationDocuments)
        .where(eq(verificationDocuments.farmerApplicationId, application[0].id))
        .orderBy(desc(verificationDocuments.uploadedAt));
    }),
    listings: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const application = await db
        .select()
        .from(farmerApplications)
        .where(eq(farmerApplications.userId, ctx.user.id))
        .limit(1);
      if (!application[0]) return [];
      const listings = await db
        .select()
        .from(products)
        .where(eq(products.farmerApplicationId, application[0].id))
        .orderBy(desc(products.createdAt));
      const images = listings.length
        ? await db.select().from(productImages)
        : [];
      const urlsByListing = new Map<number, string[]>();
      images.forEach(image => {
        const urls = urlsByListing.get(image.productId) ?? [];
        urls.push(image.displayUrl);
        urlsByListing.set(image.productId, urls);
      });
      return listings.map(listing => ({
        ...listing,
        imageUrls: urlsByListing.get(listing.id) ?? [],
      }));
    }),
    orders: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const application = await db
        .select()
        .from(farmerApplications)
        .where(
          and(
            eq(farmerApplications.userId, ctx.user.id),
            eq(farmerApplications.status, "APPROVED")
          )
        )
        .limit(1);
      if (!application[0]) return [];
      return db
        .select()
        .from(orders)
        .where(eq(orders.farmerApplicationId, application[0].id))
        .orderBy(desc(orders.createdAt));
    }),
    saveDraft: protectedProcedure
      .input(
        z.object({
          legalName: z.string().min(2).max(160),
          farmName: z.string().min(2).max(160),
          phone: z.string().min(7).max(32),
          state: z.string().min(2).max(80),
          lga: z.string().min(2).max(100),
          generalFarmArea: z.string().min(2).max(160),
          zones: z.array(z.string().min(2)).min(1).max(8),
          species: z.array(z.enum(PRODUCT_SPECIES)).min(1).max(2),
          weeklyCapacityKg: z.number().int().positive().max(100000),
          fulfillment: z
            .array(z.enum(["pickup", "farmer_delivery", "platform_delivery"]))
            .min(1),
          bankName: z.string().min(2).max(100),
          accountNumber: z.string().regex(/^\d{10}$/),
          accountName: z.string().min(2).max(160),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const existing = await db
          .select()
          .from(farmerApplications)
          .where(eq(farmerApplications.userId, ctx.user.id))
          .limit(1);
        if (existing[0] && !["DRAFT", "REJECTED"].includes(existing[0].status))
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This application is already under review or has been decided.",
          });
        const payload = {
          userId: ctx.user.id,
          legalName: input.legalName,
          farmName: input.farmName,
          phone: input.phone,
          state: input.state,
          lga: input.lga,
          generalFarmArea: input.generalFarmArea,
          zonesJson: input.zones,
          speciesJson: input.species,
          weeklyCapacityKg: input.weeklyCapacityKg,
          fulfillmentJson: input.fulfillment,
          bankName: input.bankName,
          maskedAccountNumber: maskBankAccount(input.accountNumber),
          resolvedAccountName: input.accountName,
          status: "DRAFT" as const,
          submittedAt: null,
        };
        if (existing[0])
          await db
            .update(farmerApplications)
            .set(payload)
            .where(eq(farmerApplications.id, existing[0].id));
        else await db.insert(farmerApplications).values(payload);
        return { success: true, status: "DRAFT" as const };
      }),
    submitApplication: protectedProcedure
      .input(
        z.object({
          legalName: z.string().min(2).max(160),
          farmName: z.string().min(2).max(160),
          phone: z.string().min(7).max(32),
          state: z.string().min(2).max(80),
          lga: z.string().min(2).max(100),
          generalFarmArea: z.string().min(2).max(160),
          zones: z.array(z.string().min(2)).min(1).max(8),
          species: z.array(z.enum(PRODUCT_SPECIES)).min(1).max(2),
          weeklyCapacityKg: z.number().int().positive().max(100000),
          fulfillment: z
            .array(z.enum(["pickup", "farmer_delivery", "platform_delivery"]))
            .min(1),
          bankName: z.string().min(2).max(100),
          accountNumber: z.string().regex(/^\d{10}$/),
          accountName: z.string().min(2).max(160),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const existing = await db
          .select()
          .from(farmerApplications)
          .where(eq(farmerApplications.userId, ctx.user.id))
          .limit(1);
        const payload = {
          userId: ctx.user.id,
          legalName: input.legalName,
          farmName: input.farmName,
          phone: input.phone,
          state: input.state,
          lga: input.lga,
          generalFarmArea: input.generalFarmArea,
          zonesJson: input.zones,
          speciesJson: input.species,
          weeklyCapacityKg: input.weeklyCapacityKg,
          fulfillmentJson: input.fulfillment,
          bankName: input.bankName,
          maskedAccountNumber: maskBankAccount(input.accountNumber),
          resolvedAccountName: input.accountName,
          status: "SUBMITTED" as const,
          submittedAt: new Date(),
        };
        if (existing[0])
          await db
            .update(farmerApplications)
            .set(payload)
            .where(eq(farmerApplications.id, existing[0].id));
        else await db.insert(farmerApplications).values(payload);
        await simulateNotification(
          ctx.user.id,
          "application_submitted",
          "Farmer application submitted",
          "Your application is now ready for administrator review."
        );
        return { success: true };
      }),
    uploadListingImage: protectedProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          filename: z.string().regex(/^[\w.-]{1,120}$/),
          contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
          base64: z.string().min(20).max(2_800_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const application = await db
          .select()
          .from(farmerApplications)
          .where(
            and(
              eq(farmerApplications.userId, ctx.user.id),
              eq(farmerApplications.status, "APPROVED")
            )
          )
          .limit(1);
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, input.productId))
          .limit(1);
        if (
          (!application[0] ||
            product[0]?.farmerApplicationId !== application[0].id) &&
          ctx.user.role !== "admin"
        )
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Only the approved farmer who owns this listing may upload images.",
          });
        const images = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, input.productId));
        if (images.length >= 3)
          throw new TRPCError({
            code: "CONFLICT",
            message: "A listing may have no more than three images.",
          });
        const bytes = Buffer.from(input.base64, "base64");
        if (bytes.byteLength > 2_000_000)
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "Images must be 2 MB or smaller.",
          });
        const result = await storagePut(
          `pond-basket/farmers/${ctx.user.id}/products/${input.productId}/${input.filename}`,
          bytes,
          input.contentType
        );
        await db.insert(productImages).values({
          productId: input.productId,
          storageKey: result.key,
          displayUrl: result.url,
          position: images.length + 1,
        });
        return result;
      }),
    uploadVerificationDocument: protectedProcedure
      .input(
        z.object({
          filename: z.string().regex(/^[\w.-]{1,120}$/),
          contentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
          base64: z.string().min(20).max(2_800_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const application = await db
          .select()
          .from(farmerApplications)
          .where(eq(farmerApplications.userId, ctx.user.id))
          .limit(1);
        if (!application[0])
          throw new TRPCError({
            code: "CONFLICT",
            message: "Create your farmer application before adding a document.",
          });
        const bytes = Buffer.from(input.base64, "base64");
        if (bytes.byteLength > 2_000_000)
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "Documents must be 2 MB or smaller.",
          });
        const result = await storagePut(
          `pond-basket/farmers/${ctx.user.id}/verification/${input.filename}`,
          bytes,
          input.contentType
        );
        await db.insert(verificationDocuments).values({
          farmerApplicationId: application[0].id,
          storageKey: result.key,
          originalName: input.filename,
          mimeType: input.contentType,
        });
        return { success: true };
      }),
    createListing: protectedProcedure
      .input(
        z.object({
          species: z.enum(PRODUCT_SPECIES),
          form: z.enum(["live", "fresh", "frozen"]),
          processing: z.enum(["whole", "cleaned", "cut"]),
          sizeGrade: z.enum(["small", "medium", "large", "jumbo"]),
          unit: z.enum(["kg", "piece", "batch"]),
          unitPriceKobo: z.number().int().positive(),
          minOrder: z.number().int().positive(),
          availableQuantity: z.number().int().nonnegative(),
          availabilityType: z.enum([
            "available_now",
            "scheduled_harvest",
            "preorder",
          ]),
          zones: z.array(z.string().min(2)).min(1),
          fulfillment: z
            .array(z.enum(["pickup", "farmer_delivery", "platform_delivery"]))
            .min(1),
          description: z.string().min(16).max(500),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const application = await db
          .select()
          .from(farmerApplications)
          .where(
            and(
              eq(farmerApplications.userId, ctx.user.id),
              eq(farmerApplications.status, "APPROVED")
            )
          )
          .limit(1);
        if (!application[0])
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only approved farmers can submit a product listing.",
          });
        if (!asStringArray(application[0].speciesJson).includes(input.species))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This species is not approved for the farmer profile.",
          });
        money(input.unitPriceKobo);
        const result = await db.insert(products).values({
          farmerApplicationId: application[0].id,
          ...input,
          zonesJson: input.zones,
          fulfillmentJson: input.fulfillment,
          status: "PENDING_APPROVAL",
        });
        return {
          productId: Number(result[0].insertId),
          status: "PENDING_APPROVAL" as const,
        };
      }),
    updateListingAvailability: protectedProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          availableQuantity: z.number().int().nonnegative(),
          availabilityType: z.enum([
            "available_now",
            "scheduled_harvest",
            "preorder",
          ]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const application = await db
          .select()
          .from(farmerApplications)
          .where(
            and(
              eq(farmerApplications.userId, ctx.user.id),
              eq(farmerApplications.status, "APPROVED")
            )
          )
          .limit(1);
        const listing = await db
          .select()
          .from(products)
          .where(eq(products.id, input.productId))
          .limit(1);
        if (
          !application[0] ||
          listing[0]?.farmerApplicationId !== application[0].id
        )
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Only the approved farmer who owns this listing may update availability.",
          });
        if (input.availableQuantity < listing[0].reservedQuantity)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Available quantity cannot be lower than fish already reserved by customers.",
          });
        await db
          .update(products)
          .set({
            availableQuantity: input.availableQuantity,
            availabilityType: input.availabilityType,
          })
          .where(eq(products.id, input.productId));
        return { success: true };
      }),
  }),
  orders: router({
    create: protectedProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().positive(),
          addressId: z.number().int().positive(),
          purpose: z.enum([
            "home_meal",
            "office_lunch",
            "weekend_gathering",
            "party",
            "community",
            "freezer",
            "home_operator",
            "other",
          ]),
          idempotencyKey: z.string().uuid(),
          campaignToken: z.string().uuid().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await ensureCustomerProfile(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const existing = await db
          .select()
          .from(orders)
          .where(eq(orders.idempotencyKey, input.idempotencyKey))
          .limit(1);
        if (existing[0])
          return {
            orderId: existing[0].id,
            publicCode: existing[0].publicCode,
            duplicate: true,
          };
        const address = await db
          .select()
          .from(customerAddresses)
          .where(
            and(
              eq(customerAddresses.id, input.addressId),
              eq(customerAddresses.customerId, profile.id)
            )
          )
          .limit(1);
        if (!address[0])
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Choose one of your saved addresses.",
          });
        const product = await db
          .select()
          .from(products)
          .where(
            and(eq(products.id, input.productId), eq(products.status, "ACTIVE"))
          )
          .limit(1);
        if (!product[0])
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This listing is unavailable.",
          });
        if (input.quantity < product[0].minOrder)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order quantity is below the listing minimum.",
          });
        const campaignTokenHash = input.campaignToken
          ? hashCampaignToken(input.campaignToken)
          : undefined;
        const sharedCampaign = campaignTokenHash
          ? await db
              .select({ id: shareEvents.id })
              .from(shareEvents)
              .where(
                and(
                  eq(shareEvents.productId, product[0].id),
                  eq(shareEvents.campaignTokenHash, campaignTokenHash)
                )
              )
              .limit(1)
          : [];
        const zone = await db
          .select()
          .from(serviceZones)
          .where(
            and(
              eq(serviceZones.name, address[0].serviceZone),
              eq(serviceZones.active, true)
            )
          )
          .limit(1);
        if (!zone[0])
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This address is outside the active service area.",
          });
        const commerce = await getCommerceConfig();
        const buyerServiceFeeKobo = commerce.buyerServiceFeeEnabled
          ? commerce.buyerServiceFeeKobo
          : 0;
        const calculated = calculatePricing({
          unitPriceKobo: product[0].unitPriceKobo,
          quantity: input.quantity,
          commissionRateBps: commerce.foundingCommissionBps,
          deliveryChargeKobo: zone[0].deliveryChargeKobo,
          buyerServiceFeeKobo,
        });
        const publicCode = `PB-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        const result = await db.transaction(async tx => {
          const reservation = await tx
            .update(products)
            .set({
              reservedQuantity: sql`${products.reservedQuantity} + ${input.quantity}`,
            })
            .where(
              and(
                eq(products.id, product[0].id),
                sql`${products.availableQuantity} - ${products.reservedQuantity} >= ${input.quantity}`
              )
            );
          if (
            (reservation as unknown as { affectedRows?: number })
              .affectedRows === 0
          )
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This quantity was just reserved by another customer. Please refresh availability.",
            });
          const inserted = await tx.insert(orders).values({
            publicCode,
            customerId: profile.id,
            farmerApplicationId: product[0].farmerApplicationId,
            addressId: address[0].id,
            serviceZone: address[0].serviceZone,
            status: "PENDING_PAYMENT",
            purpose: input.purpose,
            productId: product[0].id,
            quantity: input.quantity,
            idempotencyKey: input.idempotencyKey,
          });
          const orderId = Number(inserted[0].insertId);
          await tx.insert(orderPricingSnapshots).values({
            orderId,
            unitPriceKobo: product[0].unitPriceKobo,
            quantity: input.quantity,
            subtotalKobo: calculated.subtotalKobo,
            commissionRateBps: commerce.foundingCommissionBps,
            commissionType: "founding_farmers_pilot",
            commissionKobo: calculated.commissionKobo,
            deliveryChargeKobo: zone[0].deliveryChargeKobo,
            buyerServiceFeeKobo,
            buyerTotalKobo: calculated.buyerTotalKobo,
            farmerGrossKobo: calculated.farmerGrossKobo,
            farmerPayoutKobo: calculated.farmerPayoutKobo,
          });
          await tx.insert(orderEvents).values({
            orderId,
            actorId: ctx.user.id,
            fromState: "DRAFT",
            toState: "PENDING_PAYMENT",
            reason: "Inventory safely reserved; payment pending",
            correlationId: correlation(),
          });
          if (campaignTokenHash && sharedCampaign[0])
            await tx.insert(orderCampaignAttributions).values({
              orderId,
              productId: product[0].id,
              campaignTokenHash,
            });
          return orderId;
        });
        await simulateNotification(
          ctx.user.id,
          "order_created",
          "Order reserved",
          `Your ${publicCode} reservation awaits protected mock payment.`
        );
        return {
          orderId: result,
          publicCode,
          duplicate: false,
          pricing: calculated,
        };
      }),
    mockPay: protectedProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await ensureCustomerProfile(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const order = await db
          .select()
          .from(orders)
          .where(
            and(eq(orders.id, input.orderId), eq(orders.customerId, profile.id))
          )
          .limit(1);
        if (!order[0]) throw new TRPCError({ code: "NOT_FOUND" });
        if (order[0].status !== "PENDING_PAYMENT")
          throw new TRPCError({
            code: "CONFLICT",
            message: "This order is not awaiting payment.",
          });
        await db
          .update(orders)
          .set({ status: "PAID" })
          .where(eq(orders.id, input.orderId));
        await appendOrderEvent(
          input.orderId,
          ctx.user.id,
          "PENDING_PAYMENT",
          "PAID",
          "MockPaymentProvider independently verified exact NGN amount"
        );
        await simulateNotification(
          ctx.user.id,
          "payment_confirmed",
          "Protected payment confirmed",
          "Your payment has been verified in Demo Mode. The farmer will respond next."
        );
        return { success: true };
      }),
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const profile = await ensureCustomerProfile(ctx.user.id);
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(orders)
        .where(eq(orders.customerId, profile.id))
        .orderBy(desc(orders.createdAt));
    }),
    timeline: protectedProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const profile = await ensureCustomerProfile(ctx.user.id);
        const db = await getDb();
        if (!db) return [];
        const order = await db
          .select()
          .from(orders)
          .where(
            and(eq(orders.id, input.orderId), eq(orders.customerId, profile.id))
          )
          .limit(1);
        if (!order[0])
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You may only view the timeline for your own order.",
          });
        return db
          .select()
          .from(orderEvents)
          .where(eq(orderEvents.orderId, input.orderId))
          .orderBy(orderEvents.createdAt);
      }),
    transition: protectedProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
          to: orderStateSchema,
          reason: z.string().max(600).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const current = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);
        if (!current[0]) throw new TRPCError({ code: "NOT_FOUND" });
        const order = current[0];
        if (ctx.user.role !== "admin") {
          const farmer = await db
            .select()
            .from(farmerApplications)
            .where(
              and(
                eq(farmerApplications.userId, ctx.user.id),
                eq(farmerApplications.id, order.farmerApplicationId),
                eq(farmerApplications.status, "APPROVED")
              )
            )
            .limit(1);
          if (!farmer[0])
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Only the approved farmer assigned to this order may fulfill it.",
            });
          if (
            ![
              "FARMER_ACCEPTED",
              "FARMER_REJECTED",
              "PREPARING",
              "READY",
              "DISPATCHED",
            ].includes(input.to)
          )
            throw new TRPCError({ code: "FORBIDDEN" });
        }
        assertOrderTransition(order.status as OrderState, input.to);
        let pin: string | undefined;
        const setValues: {
          status: typeof input.to;
          deliveryPinHash?: string;
          pinExpiresAt?: Date;
        } = { status: input.to };
        if (input.to === "DISPATCHED") {
          pin = crypto.randomInt(100000, 999999).toString();
          setValues.deliveryPinHash = hashPin(pin);
          setValues.pinExpiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
        }
        await db
          .update(orders)
          .set(setValues)
          .where(eq(orders.id, input.orderId));
        await appendOrderEvent(
          input.orderId,
          ctx.user.id,
          order.status,
          input.to,
          input.reason ?? null
        );
        if (input.to === "COMPLETED") {
          const attribution = await db
            .select()
            .from(orderCampaignAttributions)
            .where(eq(orderCampaignAttributions.orderId, input.orderId))
            .limit(1);
          if (attribution[0]) {
            await db
              .insert(campaignConversions)
              .values({
                campaignTokenHash: attribution[0].campaignTokenHash,
                productId: attribution[0].productId,
              })
              .onDuplicateKeyUpdate({
                set: { campaignTokenHash: attribution[0].campaignTokenHash },
              });
            await db
              .delete(orderCampaignAttributions)
              .where(eq(orderCampaignAttributions.id, attribution[0].id));
          }
        }
        const farmerOwner = await db
          .select()
          .from(farmerApplications)
          .where(eq(farmerApplications.id, order.farmerApplicationId))
          .limit(1);
        const customerOwner = await db
          .select()
          .from(customerProfiles)
          .where(eq(customerProfiles.id, order.customerId))
          .limit(1);
        const customerMessage: Record<string, [string, string]> = {
          FARMER_ACCEPTED: [
            "Farmer accepted your order",
            "Your fish order is now being prepared.",
          ],
          FARMER_REJECTED: [
            "Farmer could not accept this order",
            "Your protected payment will enter the refund-review workflow.",
          ],
          READY: [
            "Your fish is ready",
            "Your selected fulfillment window is approaching.",
          ],
          DISPATCHED: [
            "Your fish has been dispatched",
            "Inspect your fish before sharing the buyer-held delivery PIN.",
          ],
        };
        const message = customerMessage[input.to];
        if (message && customerOwner[0])
          await simulateNotification(
            customerOwner[0].userId,
            input.to.toLowerCase(),
            message[0],
            message[1]
          );
        if (message && farmerOwner[0])
          await simulateNotification(
            farmerOwner[0].userId,
            input.to.toLowerCase(),
            message[0],
            message[1]
          );
        return { success: true, demoCustomerPin: pin };
      }),
    confirmDelivery: protectedProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
          pin: z.string().regex(/^\d{6}$/),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const order = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);
        if (!order[0]) throw new TRPCError({ code: "NOT_FOUND" });
        const profile = await ensureCustomerProfile(ctx.user.id);
        if (order[0].customerId !== profile.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Only the customer may confirm delivery with the buyer-held PIN.",
          });
        if (
          order[0].status !== "DISPATCHED" ||
          !order[0].deliveryPinHash ||
          !order[0].pinExpiresAt ||
          order[0].pinExpiresAt < new Date()
        )
          throw new TRPCError({
            code: "CONFLICT",
            message: "This PIN is not currently eligible for use.",
          });
        if (order[0].pinAttempts >= 5)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "PIN locked after too many attempts.",
          });
        if (!verifyPin(input.pin, order[0].deliveryPinHash)) {
          await db
            .update(orders)
            .set({ pinAttempts: order[0].pinAttempts + 1 })
            .where(eq(orders.id, order[0].id));
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "That delivery PIN is incorrect.",
          });
        }
        await db
          .update(orders)
          .set({
            status: "DELIVERED_PENDING_RELEASE",
            deliveredAt: new Date(),
            deliveryPinHash: null,
          })
          .where(eq(orders.id, order[0].id));
        await appendOrderEvent(
          order[0].id,
          ctx.user.id,
          "DISPATCHED",
          "DELIVERED_PENDING_RELEASE",
          "Customer inspection accepted; buyer-held PIN used once"
        );
        return { success: true };
      }),
    openDispute: protectedProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
          reason: z.enum([
            "Non-delivery",
            "Wrong species",
            "Wrong size or grade",
            "Wrong product form",
            "Incorrect quantity",
            "Incorrect weight",
            "Quality problem",
            "Spoilage",
            "Unsafe delivery",
            "Duplicate charge",
            "Other",
          ]),
          detail: z.string().min(8).max(1200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await ensureCustomerProfile(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const order = await db
          .select()
          .from(orders)
          .where(
            and(eq(orders.id, input.orderId), eq(orders.customerId, profile.id))
          )
          .limit(1);
        if (!order[0]) throw new TRPCError({ code: "NOT_FOUND" });
        await db.transaction(async tx => {
          await tx
            .update(orders)
            .set({ status: "DISPUTED" })
            .where(eq(orders.id, input.orderId));
          await tx.insert(disputes).values({
            orderId: input.orderId,
            openedByUserId: ctx.user.id,
            reason: input.reason,
            detail: input.detail,
          });
        });
        await appendOrderEvent(
          input.orderId,
          ctx.user.id,
          order[0].status,
          "DISPUTED",
          "Customer safety or product concern opened"
        );
        return { success: true };
      }),
  }),
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return demoNotifications;
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(30);
      return userNotifications.length ? userNotifications : demoNotifications;
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: true };
        await db
          .update(notifications)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(notifications.id, input.id),
              eq(notifications.userId, ctx.user.id)
            )
          );
        return { success: true };
      }),
  }),
  admin: router({
    overview: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db)
        return {
          zones: 3,
          applications: 5,
          pendingProducts: 2,
          openDisputes: 1,
          payments: "SIMULATED",
          demoMode: BRAND.demoMode,
        };
      const [zones, applications, openDisputes] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(serviceZones),
        db.select({ count: sql<number>`count(*)` }).from(farmerApplications),
        db
          .select({ count: sql<number>`count(*)` })
          .from(disputes)
          .where(eq(disputes.status, "OPEN")),
      ]);
      return {
        zones: Number(zones[0]?.count ?? 0),
        applications: Number(applications[0]?.count ?? 0),
        pendingProducts: 2,
        openDisputes: Number(openDisputes[0]?.count ?? 0),
        payments: "SIMULATED",
        demoMode: BRAND.demoMode,
      };
    }),
    shareAnalytics: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db)
        return {
          total: 0,
          catalog: 0,
          product: 0,
          completedConversions: 0,
          weeklyTrend: buildDailyShareTrend([]),
          monthlyTrend: buildMonthlyShareTrend([]),
          topProducts: [] as { productId: number; shareCount: number }[],
        };
      const trendStart = new Date();
      trendStart.setUTCMonth(trendStart.getUTCMonth() - 5, 1);
      trendStart.setUTCHours(0, 0, 0, 0);
      const [byType, topProductRows, trendEvents, conversionCount] =
        await Promise.all([
          db
            .select({
              shareType: shareEvents.shareType,
              shareCount: sql<number>`count(*)`,
            })
            .from(shareEvents)
            .groupBy(shareEvents.shareType),
          db
            .select({
              productId: shareEvents.productId,
              shareCount: sql<number>`count(*)`,
            })
            .from(shareEvents)
            .where(
              and(
                eq(shareEvents.shareType, "product"),
                isNotNull(shareEvents.productId)
              )
            )
            .groupBy(shareEvents.productId)
            .orderBy(desc(sql`count(*)`))
            .limit(5),
          db
            .select({ createdAt: shareEvents.createdAt })
            .from(shareEvents)
            .where(gte(shareEvents.createdAt, trendStart)),
          db.select({ count: sql<number>`count(*)` }).from(campaignConversions),
        ]);
      const countFor = (shareType: "catalog" | "product") =>
        Number(
          byType.find(event => event.shareType === shareType)?.shareCount ?? 0
        );
      const catalog = countFor("catalog");
      const product = countFor("product");
      return {
        total: catalog + product,
        catalog,
        product,
        completedConversions: Number(conversionCount[0]?.count ?? 0),
        weeklyTrend: buildDailyShareTrend(trendEvents),
        monthlyTrend: buildMonthlyShareTrend(trendEvents),
        topProducts: topProductRows.flatMap(event =>
          event.productId === null
            ? []
            : [
                {
                  productId: event.productId,
                  shareCount: Number(event.shareCount),
                },
              ]
        ),
      };
    }),
    applications: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const applications = await db
        .select()
        .from(farmerApplications)
        .orderBy(desc(farmerApplications.createdAt));
      const documents = applications.length
        ? await db.select().from(verificationDocuments)
        : [];
      return applications.map(application => ({
        ...application,
        documents: documents
          .filter(document => document.farmerApplicationId === application.id)
          .map(document => ({
            id: document.id,
            originalName: document.originalName,
            mimeType: document.mimeType,
            uploadedAt: document.uploadedAt,
          })),
      }));
    }),
    reviewApplication: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: farmerStateSchema,
          note: z.string().min(2).max(600),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const application = await db
          .select()
          .from(farmerApplications)
          .where(eq(farmerApplications.id, input.id))
          .limit(1);
        if (!application[0])
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Farmer application not found.",
          });
        await db
          .update(farmerApplications)
          .set({
            status: input.status,
            reviewerNote: input.note,
            reviewedAt: new Date(),
          })
          .where(eq(farmerApplications.id, input.id));
        if (input.status === "APPROVED")
          await db
            .update(users)
            .set({ role: "farmer" })
            .where(eq(users.id, application[0].userId));
        if (input.status === "APPROVED")
          await simulateNotification(
            application[0].userId,
            "farmer_accepted",
            "Your farm is approved",
            "You can now create listings, upload product photos, and manage paid orders."
          );
        if (input.status === "REJECTED")
          await simulateNotification(
            application[0].userId,
            "farmer_rejected",
            "Your application needs changes",
            input.note
          );
        return { success: true };
      }),
    products: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const listings = await db
        .select()
        .from(products)
        .orderBy(desc(products.createdAt));
      const images = listings.length
        ? await db.select().from(productImages)
        : [];
      return listings.map(listing => ({
        ...listing,
        imageUrls: images
          .filter(image => image.productId === listing.id)
          .map(image => image.displayUrl),
      }));
    }),
    reviewProduct: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum(["ACTIVE", "INACTIVE", "REJECTED"]),
          note: z.string().min(2).max(600),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .update(products)
          .set({ status: input.status })
          .where(eq(products.id, input.id));
        return { success: true };
      }),
    verificationDocumentUrl: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const document = await db
          .select()
          .from(verificationDocuments)
          .where(eq(verificationDocuments.id, input.id))
          .limit(1);
        if (!document[0]) throw new TRPCError({ code: "NOT_FOUND" });
        const { storageGetSignedUrl } = await import("./storage");
        return { url: await storageGetSignedUrl(document[0].storageKey) };
      }),
    zones: adminProcedure.query(async () => {
      const db = await getDb();
      return db ? db.select().from(serviceZones) : [];
    }),
    addZone: adminProcedure
      .input(
        z.object({
          name: z.string().min(2).max(100),
          state: z.string().min(2).max(80),
          city: z.string().min(2).max(100),
          lga: z.string().min(2).max(100),
          deliveryChargeKobo: z.number().int().nonnegative(),
          dailyOrderCapacity: z.number().int().positive(),
          windows: z.array(z.string().min(2)).min(1),
        })
      )
      .mutation(async ({ input }) => {
        money(input.deliveryChargeKobo);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .insert(serviceZones)
          .values({ ...input, windowsJson: input.windows });
        return { success: true };
      }),
    setZoneActive: adminProcedure
      .input(z.object({ id: z.number().int().positive(), active: z.boolean() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .update(serviceZones)
          .set({ active: input.active })
          .where(eq(serviceZones.id, input.id));
        return { success: true };
      }),
    flags: adminProcedure.query(async () => {
      const db = await getDb();
      return db ? db.select().from(featureFlags) : [];
    }),
    setFlag: adminProcedure
      .input(z.object({ key: z.string().min(2).max(80), enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .insert(featureFlags)
          .values({
            key: input.key,
            enabled: input.enabled,
            description: `PondBasket feature: ${input.key}`,
            updatedByUserId: ctx.user.id,
          })
          .onDuplicateKeyUpdate({
            set: { enabled: input.enabled, updatedByUserId: ctx.user.id },
          });
        return { success: true };
      }),
    commerce: adminProcedure.query(async () => getCommerceConfig()),
    saveCommerce: adminProcedure
      .input(
        z.object({
          foundingCommissionBps: z.number().int().min(0).max(3000),
          standardCommissionBps: z.number().int().min(0).max(3000),
          managedFulfillmentCommissionBps: z.number().int().min(0).max(3000),
          buyerServiceFeeEnabled: z.boolean(),
          buyerServiceFeeKobo: z.number().int().min(0).max(500000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        money(input.buyerServiceFeeKobo);
        await db
          .insert(platformSettings)
          .values({
            key: "commerce",
            valueJson: input,
            updatedByUserId: ctx.user.id,
          })
          .onDuplicateKeyUpdate({
            set: { valueJson: input, updatedByUserId: ctx.user.id },
          });
        return { success: true };
      }),
    recordPayout: adminProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
          note: z.string().min(4).max(600),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const order = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);
        if (!order[0] || order[0].status === "DISPUTED")
          throw new TRPCError({
            code: "CONFLICT",
            message: "A disputed or missing order cannot be paid out.",
          });
        const snapshot = await db
          .select()
          .from(orderPricingSnapshots)
          .where(eq(orderPricingSnapshots.orderId, input.orderId))
          .limit(1);
        if (!snapshot[0]) throw new TRPCError({ code: "NOT_FOUND" });
        await db
          .insert(payouts)
          .values({
            orderId: input.orderId,
            farmerApplicationId: order[0].farmerApplicationId,
            amountKobo: snapshot[0].farmerPayoutKobo,
            status: "RECORDED",
            recordedByUserId: ctx.user.id,
            note: input.note,
          })
          .onDuplicateKeyUpdate({
            set: {
              status: "RECORDED",
              note: input.note,
              recordedByUserId: ctx.user.id,
            },
          });
        return { success: true };
      }),
  }),
  system: router({
    readiness: publicProcedure.query(() => ({
      status: "OPERATIONAL",
      demoMode: BRAND.demoMode,
      checks: {
        database: "configured",
        payments: "mock provider",
        notifications: "in-app + simulated email",
        productionFinancials: "disabled",
      },
    })),
  }),
});

export type AppRouter = typeof appRouter;
