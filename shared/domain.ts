export const ORDER_STATES = [
  "DRAFT", "PENDING_PAYMENT", "PAYMENT_PROCESSING", "PAID_PENDING_REVIEW", "PAID",
  "FARMER_ACCEPTED", "FARMER_REJECTED", "PREPARING", "READY", "DISPATCHED",
  "DELIVERED_PENDING_RELEASE", "COMPLETED", "CANCELLED", "DISPUTED", "REFUND_PENDING", "REFUNDED",
] as const;
export type OrderState = (typeof ORDER_STATES)[number];

export const FARMER_APPLICATION_STATES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"] as const;
export type FarmerApplicationState = (typeof FARMER_APPLICATION_STATES)[number];

export type PricingInput = {
  unitPriceKobo: number;
  quantity: number;
  commissionRateBps: number;
  deliveryChargeKobo: number;
  buyerServiceFeeKobo?: number;
};

export function calculatePricing(input: PricingInput) {
  if (![input.unitPriceKobo, input.quantity, input.commissionRateBps, input.deliveryChargeKobo, input.buyerServiceFeeKobo ?? 0].every(Number.isInteger)) {
    throw new Error("Money and pricing inputs must be integer values");
  }
  if (input.unitPriceKobo < 0 || input.quantity < 1 || input.commissionRateBps < 0 || input.deliveryChargeKobo < 0) {
    throw new Error("Pricing inputs must be non-negative and quantity must be at least one");
  }
  const subtotalKobo = input.unitPriceKobo * input.quantity;
  const commissionKobo = Math.floor((subtotalKobo * input.commissionRateBps) / 10_000);
  const buyerServiceFeeKobo = input.buyerServiceFeeKobo ?? 0;
  return {
    subtotalKobo,
    commissionKobo,
    deliveryChargeKobo: input.deliveryChargeKobo,
    buyerTotalKobo: subtotalKobo + input.deliveryChargeKobo + buyerServiceFeeKobo,
    farmerGrossKobo: subtotalKobo,
    farmerPayoutKobo: subtotalKobo - commissionKobo,
    buyerServiceFeeKobo,
  };
}

const TRANSITIONS: Record<OrderState, readonly OrderState[]> = {
  DRAFT: ["PENDING_PAYMENT", "CANCELLED"],
  PENDING_PAYMENT: ["PAYMENT_PROCESSING", "CANCELLED"],
  PAYMENT_PROCESSING: ["PAID_PENDING_REVIEW", "PENDING_PAYMENT", "CANCELLED"],
  PAID_PENDING_REVIEW: ["PAID", "CANCELLED", "REFUND_PENDING"],
  PAID: ["FARMER_ACCEPTED", "FARMER_REJECTED", "CANCELLED", "DISPUTED", "REFUND_PENDING"],
  FARMER_ACCEPTED: ["PREPARING", "DISPUTED", "CANCELLED"],
  FARMER_REJECTED: ["REFUND_PENDING", "REFUNDED"],
  PREPARING: ["READY", "DISPUTED"],
  READY: ["DISPATCHED", "DISPUTED"],
  DISPATCHED: ["DELIVERED_PENDING_RELEASE", "DISPUTED"],
  DELIVERED_PENDING_RELEASE: ["COMPLETED", "DISPUTED"],
  COMPLETED: [],
  CANCELLED: ["REFUND_PENDING", "REFUNDED"],
  DISPUTED: ["REFUND_PENDING", "REFUNDED", "COMPLETED"],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
};

export function assertOrderTransition(from: OrderState, to: OrderState) {
  if (!TRANSITIONS[from]?.includes(to)) throw new Error(`Illegal order transition: ${from} → ${to}`);
}

export function maskBankAccount(accountNumber: string) {
  const lastFour = accountNumber.slice(-4);
  return `${"•".repeat(Math.max(0, accountNumber.length - 4))}${lastFour}`;
}
