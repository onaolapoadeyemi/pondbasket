import { describe, expect, it } from "vitest";
import { parseCampaignToken, withCampaignToken } from "./campaign";

const token = "123e4567-e89b-42d3-a456-426614174000";

describe("anonymous campaign URL state", () => {
  it("reads only a valid allowlisted UUID campaign token", () => {
    expect(parseCampaignToken(`?campaign=${token}`)).toBe(token);
    expect(
      parseCampaignToken("?campaign=visitor%40example.com")
    ).toBeUndefined();
    expect(parseCampaignToken("?campaign=not-a-token")).toBeUndefined();
  });

  it("adds the token without altering the canonical listing path", () => {
    expect(withCampaignToken("https://pond.example/shop/601", token)).toBe(
      `https://pond.example/shop/601?campaign=${token}`
    );
  });
});
