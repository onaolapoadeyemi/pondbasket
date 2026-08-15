import { describe, expect, it, vi } from "vitest";
import { shareLink } from "./shareLink";

const shareInput = {
  title: "Fresh catfish from PondBasket",
  text: "Explore fresh fish in your zone.",
  url: "https://pond.example/shop/44",
};

describe("shareLink", () => {
  it("uses the native share sheet when the browser supports it", async () => {
    const share = vi.fn(async () => undefined);
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });

    await expect(shareLink(shareInput)).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith(shareInput);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("uses the clipboard when native sharing is unavailable", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(shareLink(shareInput)).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith(shareInput.url);
  });

  it("falls back to the clipboard when native sharing fails", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", {
      share: vi.fn(async () => {
        throw new Error("Not supported by this share target");
      }),
      clipboard: { writeText },
    });

    await expect(shareLink(shareInput)).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith(shareInput.url);
  });

  it("does not copy after a person deliberately closes the native share sheet", async () => {
    const writeText = vi.fn(async () => undefined);
    const cancelled = Object.assign(new Error("dismissed"), {
      name: "AbortError",
    });
    vi.stubGlobal("navigator", {
      share: vi.fn(async () => {
        throw cancelled;
      }),
      clipboard: { writeText },
    });

    await expect(shareLink(shareInput)).resolves.toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });
});
