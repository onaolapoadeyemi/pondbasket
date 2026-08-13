import { BRAND } from "../../shared/brand";

export const demoCatalog = [
  { id: 1, farmerId: 1, farmer: "Akinola Pond Farm", farmerArea: "Ibeju-Lekki", verified: true, species: "catfish", form: "fresh", processing: "cleaned", sizeGrade: "large", unit: "kg", unitPriceKobo: 485000, minOrder: 2, availableQuantity: 48, availabilityType: "available_now", availabilityDate: "Today", zones: ["Lekki Phase 1", "Chevron", "Ajah"], fulfillment: ["farmer_delivery", "pickup"], description: "Freshly harvested African catfish, cleaned to order and packed for home cooking.", accent: "pond" },
  { id: 2, farmerId: 2, farmer: "Olowo Freshwater Farms", farmerArea: "Sangotedo", verified: true, species: "tilapia", form: "fresh", processing: "whole", sizeGrade: "medium", unit: "kg", unitPriceKobo: 420000, minOrder: 1, availableQuantity: 32, availabilityType: "available_now", availabilityDate: "Today", zones: ["Ajah", "Sangotedo", "Ikate"], fulfillment: ["platform_delivery", "pickup"], description: "Firm, sweet tilapia harvested from a monitored freshwater pond this morning.", accent: "leaf" },
  { id: 3, farmerId: 1, farmer: "Akinola Pond Farm", farmerArea: "Ibeju-Lekki", verified: true, species: "catfish", form: "live", processing: "whole", sizeGrade: "jumbo", unit: "piece", unitPriceKobo: 1850000, minOrder: 1, availableQuantity: 9, availabilityType: "scheduled_harvest", availabilityDate: "Saturday, 8:00–11:00", zones: ["Lekki Phase 1", "Chevron", "Ajah"], fulfillment: ["pickup", "farmer_delivery"], description: "Jumbo live catfish reserved for grills, gatherings, and occasion cooking.", accent: "clay" },
  { id: 4, farmerId: 3, farmer: "Green Creek Aquaculture", farmerArea: "Badore", verified: true, species: "tilapia", form: "frozen", processing: "cut", sizeGrade: "large", unit: "batch", unitPriceKobo: 1360000, minOrder: 1, availableQuantity: 18, availabilityType: "preorder", availabilityDate: "Ready in 48 hours", zones: ["Ajah", "Chevron", "Victoria Island"], fulfillment: ["platform_delivery"], description: "Portioned tilapia cuts, flash-frozen shortly after harvest for freezer stocking.", accent: "ink" },
];

export const demoNotifications = [
  { id: "n1", title: "Order ready for dispatch", body: "Your catfish order is being prepared for the selected delivery window.", time: "8 min ago", unread: true },
  { id: "n2", title: "Location confirmed", body: `${BRAND.activeServiceLocation} is within the current pilot service area.`, time: "Today", unread: true },
  { id: "n3", title: "Inspection comes first", body: "Share the delivery PIN only after you have inspected and accepted your fish.", time: "Yesterday", unread: false },
];
