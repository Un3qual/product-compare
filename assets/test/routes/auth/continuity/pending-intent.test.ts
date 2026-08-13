import {
  PENDING_INTENT_TTL_MS,
  PENDING_INTENT_STORAGE_KEY,
  consumePendingIntent,
  readPendingIntent,
  safeRelativeReturnPath,
  writePendingIntent,
  type PendingIntent,
} from "../../../../src/routes/auth/continuity/pending-intent";

const NOW = Date.UTC(2026, 7, 13, 12, 0, 0);

const watchIntent = (overrides: Partial<PendingIntent> = {}): PendingIntent =>
  ({
    kind: "price_watch",
    version: 1,
    expiresAt: NOW + 10 * 60_000,
    returnTo: "/products/desk-lamp?merchant=one#watch",
    productId: "product-1",
    ruleType: "TARGET_PRICE",
    amount: "75.00",
    currency: "USD",
    ...overrides,
  }) as PendingIntent;

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

test("round-trips the exact supported price-watch draft without reinterpreting typed values", () => {
  const intent = watchIntent();

  writePendingIntent(intent);

  expect(readPendingIntent(NOW)).toEqual({
    ...intent,
    expiresAt: NOW + PENDING_INTENT_TTL_MS,
  });
});

test("stamps a fresh expiry when the draft is persisted", () => {
  writePendingIntent(watchIntent({ expiresAt: NOW - 1 }));

  expect(JSON.parse(sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY) ?? "null")).toEqual({
    ...watchIntent(),
    expiresAt: NOW + PENDING_INTENT_TTL_MS,
  });
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

  const restored = readPendingIntent(NOW);
  expect(restored).toEqual({ ...intent, expiresAt: NOW + PENDING_INTENT_TTL_MS });
  expect(restored?.kind === "save_comparison" ? restored.productIds : null).toEqual([
    "product-lamp",
    "product-chair",
  ]);
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

  expect(consumePendingIntent(NOW)).toEqual({
    ...intent,
    expiresAt: NOW + PENDING_INTENT_TTL_MS,
  });
  expect(consumePendingIntent(NOW)).toBeNull();
});

test("treats unavailable storage operations as an absent draft", () => {
  const unavailableStorage = {
    getItem() {
      throw new DOMException("Storage disabled", "SecurityError");
    },
    removeItem() {
      throw new DOMException("Storage disabled", "SecurityError");
    },
    setItem() {
      throw new DOMException("Storage full", "QuotaExceededError");
    },
  } as unknown as Storage;

  expect(() => writePendingIntent(watchIntent(), unavailableStorage)).not.toThrow();
  expect(readPendingIntent(NOW, unavailableStorage)).toBeNull();
  expect(consumePendingIntent(NOW, unavailableStorage)).toBeNull();
});

test("treats an inaccessible browser sessionStorage getter as unavailable", () => {
  const sessionStorageGetter = vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
    throw new DOMException("Storage disabled", "SecurityError");
  });

  try {
    expect(() => writePendingIntent(watchIntent())).not.toThrow();
    expect(readPendingIntent(NOW)).toBeNull();
  } finally {
    sessionStorageGetter.mockRestore();
  }
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
