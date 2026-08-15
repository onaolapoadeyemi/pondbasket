import { describe, expect, it } from "vitest";
import {
  campaignConversions,
  orderCampaignAttributions,
  shareEvents,
} from "../drizzle/schema";

describe("shareEvents privacy schema", () => {
  it("contains only aggregate share dimensions and timestamp metadata", () => {
    expect(shareEvents).toHaveProperty("id");
    expect(shareEvents).toHaveProperty("shareType");
    expect(shareEvents).toHaveProperty("productId");
    expect(shareEvents).toHaveProperty("campaignTokenHash");
    expect(shareEvents).toHaveProperty("createdAt");
  });

  it("excludes direct user, network, device, URL, and search-query identifiers", () => {
    expect(shareEvents).not.toHaveProperty("userId");
    expect(shareEvents).not.toHaveProperty("ipAddress");
    expect(shareEvents).not.toHaveProperty("deviceId");
    expect(shareEvents).not.toHaveProperty("url");
    expect(shareEvents).not.toHaveProperty("searchQuery");
  });

  it("keeps completed conversion reporting separate from orders and identities", () => {
    expect(campaignConversions).toHaveProperty("campaignTokenHash");
    expect(campaignConversions).toHaveProperty("productId");
    expect(campaignConversions).toHaveProperty("convertedAt");
    expect(campaignConversions).not.toHaveProperty("orderId");
    expect(campaignConversions).not.toHaveProperty("customerId");
    expect(campaignConversions).not.toHaveProperty("userId");
  });

  it("uses a short-lived internal handoff without customer or user fields", () => {
    expect(orderCampaignAttributions).toHaveProperty("orderId");
    expect(orderCampaignAttributions).toHaveProperty("productId");
    expect(orderCampaignAttributions).toHaveProperty("campaignTokenHash");
    expect(orderCampaignAttributions).not.toHaveProperty("customerId");
    expect(orderCampaignAttributions).not.toHaveProperty("userId");
    expect(orderCampaignAttributions).not.toHaveProperty("ipAddress");
  });
});
