import { describe, expect, it } from "vitest";
import { buildDailyShareTrend, buildMonthlyShareTrend } from "./shareTrends";

describe("share trend presentation", () => {
  const now = new Date("2026-08-15T12:00:00.000Z");

  it("fills all seven daily buckets while retaining real aggregate counts", () => {
    const trend = buildDailyShareTrend(
      [
        { createdAt: new Date("2026-08-09T10:00:00.000Z") },
        { createdAt: new Date("2026-08-15T10:00:00.000Z") },
        { createdAt: new Date("2026-08-15T11:00:00.000Z") },
      ],
      now
    );
    expect(trend).toHaveLength(7);
    expect(trend[0]).toMatchObject({ period: "2026-08-09", shares: 1 });
    expect(trend[6]).toMatchObject({ period: "2026-08-15", shares: 2 });
    expect(trend[1]?.shares).toBe(0);
  });

  it("fills six monthly buckets without relying on user-level data", () => {
    const trend = buildMonthlyShareTrend(
      [
        { createdAt: new Date("2026-03-01T10:00:00.000Z") },
        { createdAt: new Date("2026-08-01T10:00:00.000Z") },
      ],
      now
    );
    expect(trend).toHaveLength(6);
    expect(trend[0]).toMatchObject({ period: "2026-03", shares: 1 });
    expect(trend[5]).toMatchObject({ period: "2026-08", shares: 1 });
  });
});
