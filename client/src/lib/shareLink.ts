export type ShareLinkInput = {
  title: string;
  text?: string;
  url: string;
};

export type ShareLinkResult = "shared" | "copied" | "unavailable" | "cancelled";

export function supportsNativeShare() {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

export function createAnonymousCampaignToken() {
  return globalThis.crypto?.randomUUID?.() ?? undefined;
}

function isShareCancellation(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Opens the platform share sheet when it is supported, then falls back to the
 * clipboard. This utility intentionally does not collect device or user data.
 */
export async function shareLink({
  title,
  text,
  url,
}: ShareLinkInput): Promise<ShareLinkResult> {
  if (typeof navigator === "undefined") return "unavailable";

  if (supportsNativeShare()) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (isShareCancellation(error)) return "cancelled";
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch {
      // The UI will provide an explicit unavailable state below.
    }
  }

  return "unavailable";
}
