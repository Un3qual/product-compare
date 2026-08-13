import {
  PENDING_INTENT_STORAGE_KEY,
  consumePendingIntent,
  readPendingIntent,
  safeRelativeReturnPath,
  writePendingIntent,
  type PendingIntent,
} from "../../../../src/routes/auth/continuity/pending-intent";

const NOW = Date.UTC(2026, 7, 13, 12, 0, 0);

const watchIntent = (overrides: Partial<PendingIntent> = {}): PendingIntent => ({
  kind: "price_watch",
  version: 1,
  expiresAt: NOW + 10 * 60_000,
  returnTo: "/products/desk-lamp?merchant=one#watch",
  productId: "product-1",
  ruleType: "TARGET_PRICE",
  amount: "75.00",
  currency: "USD",
  ...overrides,
} as PendingIntent);

beforeEach(() => {
  sessionStorage.clear();
});

test("round-trips the exact supported price-watch draft without reinterpreting typed values", () => {
  const intent = watchIntent();

  writePendingIntent(intent);

  expect(readPendingIntent(NOW)).toEqual(intent);
});

test("preserves ordered comparison identity", () => {
  const intent: PendingIntent = {
    kind: "save_comparison",
    version: 1,
    expiresAt: NOW + 10 * 60_000,
    returnTo: "/compare?slug=lamp&slug=chair",
    productIds: ["product-lamp", "product-chair"],
  };

  writePendingIntent(intent);

  expect(readPendingIntent(NOW)).toEqual(intent);
  expect(readPendingIntent(NOW)?.kind === "save_comparison" && readPendingIntent(NOW)?.productIds)
    .toEqual(["product-lamp", "product-chair"]);
});

test.each([
  ["corrupt JSON", "{"],
  ["wrong version", JSON.stringify({ ...watchIntent(), version: 2 })],
  ["expired", JSON.stringify(watchIntent({ expiresAt: NOW - 1 }))],
  ["excessive lifetime", JSON.stringify(watchIntent({ expiresAt: NOW + 31 * 60_000 }))],
  ["extra fields", JSON.stringify({ ...watchIntent(), password: "never-store-me" })],
  ["unsupported rule", JSON.stringify(watchIntent({ ruleType: "UNKNOWN" } as never))],
])("discards %s instead of returning a partial intent", (_label, storedValue) => {
  sessionStorage.setItem(PENDING_INTENT_STORAGE_KEY, storedValue);

  expect(readPendingIntent(NOW)).toBeNull();
  expect(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY)).toBeNull();
});

test("consume returns one valid draft and removes it", () => {
  const intent = watchIntent();
  writePendingIntent(intent);

  expect(consumePendingIntent(NOW)).toEqual(intent);
  expect(consumePendingIntent(NOW)).toBeNull();
});

test.each([
  "https://evil.example/compare",
  "//evil.example/compare",
  "\\\\evil.example\\compare",
  "/auth/login?returnTo=/compare",
  "/auth/register",
  "compare?slug=lamp",
  "/compare\nSet-Cookie:bad",
])("rejects unsafe or looping return target %s", (value) => {
  expect(safeRelativeReturnPath(value, "https://app.example.com")).toBeNull();
});

test("accepts a same-origin single-slash path with query and hash", () => {
  expect(
    safeRelativeReturnPath(
      "/compare?slug=lamp&slug=chair#specifications",
      "https://app.example.com",
    ),
  ).toBe("/compare?slug=lamp&slug=chair#specifications");
});
