export const BRAND = {
  name: "PondBasket",
  tagline: "Fresh from the pond to your table.",
  marketplaceDescription:
    "Fresh farmed fish for your home, workplace, family gathering, or celebration—clearly priced and conveniently delivered.",
  legalOperator: "PondBasket Demo Operations",
  supportContact: "support@pondbasket.demo",
  serviceLocation: "Lagos, Nigeria",
  feeLanguage: "Delivery is shown separately before payment. Buyer service fee is off in Demo Mode.",
  commissionLanguage: "Farm commissions are calculated from the fish merchandise subtotal.",
  deliveryLanguage: "Pickup and local delivery are available in configured service zones.",
  legalStatus: "DRAFT — REQUIRES REVIEW BY QUALIFIED NIGERIAN COUNSEL BEFORE PRODUCTION",
  demoMode: true,
  colors: {
    ink: "#092B2A",
    forest: "#0B4F4A",
    pond: "#177E73",
    leaf: "#D6E46B",
    cream: "#F6F4EC",
    clay: "#E9754D",
  },
  activeServiceLocation: "Lekki, Lagos",
  commerceDefaults: {
    foundingCommissionBps: 1000,
    standardCommissionBps: 1200,
    managedFulfillmentCommissionBps: 1500,
    buyerServiceFeeEnabled: false,
    buyerServiceFeeKobo: 0,
  },
} as const;

export const PRODUCT_SPECIES = ["catfish", "tilapia"] as const;
export type ProductSpecies = (typeof PRODUCT_SPECIES)[number];
