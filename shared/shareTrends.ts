export type ShareTrendEvent = { createdAt: Date };
export type ShareTrendPoint = { period: string; label: string; shares: number };

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

export function buildDailyShareTrend(
  events: ShareTrendEvent[],
  now = new Date()
): ShareTrendPoint[] {
  const counts = new Map<string, number>();
  events.forEach(event => {
    const key = dateKey(event.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - 6 + index);
    const period = dateKey(date);
    return {
      period,
      label: new Intl.DateTimeFormat("en-NG", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(date),
      shares: counts.get(period) ?? 0,
    };
  });
}

export function buildMonthlyShareTrend(
  events: ShareTrendEvent[],
  now = new Date()
): ShareTrendPoint[] {
  const counts = new Map<string, number>();
  events.forEach(event => {
    const key = monthKey(event.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(end);
    date.setUTCMonth(end.getUTCMonth() - 5 + index);
    const period = monthKey(date);
    return {
      period,
      label: new Intl.DateTimeFormat("en-NG", {
        month: "short",
        timeZone: "UTC",
      }).format(date),
      shares: counts.get(period) ?? 0,
    };
  });
}
