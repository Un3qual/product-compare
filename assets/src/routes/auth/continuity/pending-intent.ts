import type { PriceWatchRuleType as RelayPriceWatchRuleType } from "$generated/AlertOperationsCreatePriceWatchMutation.graphql";

export const PENDING_INTENT_STORAGE_KEY = "product-compare.pending-intent";
export const PENDING_INTENT_MAX_LIFETIME_MS = 30 * 60_000;
export const PENDING_INTENT_TTL_MS = 15 * 60_000;

type PriceWatchRuleType = Exclude<RelayPriceWatchRuleType, "%future added value">;

export type PriceWatchIntent = Readonly<{
  amount: string | null;
  currency: string;
  expiresAt: number;
  kind: "price_watch";
  productId: string;
  returnTo: string;
  ruleType: PriceWatchRuleType;
  version: 1;
}>;

export type SaveComparisonIntent = Readonly<{
  expiresAt: number;
  kind: "save_comparison";
  productIds: readonly string[];
  returnTo: string;
  version: 1;
}>;

export type PendingIntent = PriceWatchIntent | SaveComparisonIntent;

const PRICE_WATCH_RULE_TYPES = new Set<PriceWatchRuleType>([
  "TARGET_PRICE",
  "PERCENTAGE_DROP",
  "BACK_IN_STOCK",
  "NEWLY_AVAILABLE",
]);

export function writePendingIntent(
  intent: PendingIntent,
  storage: Storage | null = browserSessionStorage(),
) {
  storage?.setItem(PENDING_INTENT_STORAGE_KEY, JSON.stringify(intent));
}

export function readPendingIntent(
  now = Date.now(),
  storage: Storage | null = browserSessionStorage(),
): PendingIntent | null {
  const storedValue = storage?.getItem(PENDING_INTENT_STORAGE_KEY);

  if (!storedValue) return null;

  try {
    const intent = parsePendingIntent(JSON.parse(storedValue), now);

    if (intent) return intent;
  } catch {
    // Invalid browser storage is treated as an absent draft.
  }

  storage?.removeItem(PENDING_INTENT_STORAGE_KEY);
  return null;
}

export function consumePendingIntent(
  now = Date.now(),
  storage: Storage | null = browserSessionStorage(),
) {
  const intent = readPendingIntent(now, storage);

  if (intent) storage?.removeItem(PENDING_INTENT_STORAGE_KEY);
  return intent;
}

export function safeRelativeReturnPath(value: string | null | undefined, origin = browserOrigin()) {
  if (!value || !origin) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/u.test(value)) return null;

  try {
    const url = new URL(value, origin);

    if (url.origin !== new URL(origin).origin) return null;
    if (url.pathname === "/auth/login" || url.pathname === "/auth/register") return null;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function pendingIntentReturnPath() {
  if (typeof window === "undefined") return "/";
  return (
    safeRelativeReturnPath(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
      window.location.origin,
    ) ?? "/"
  );
}

export function authContinuationPath(
  authPath: "/auth/login" | "/auth/register",
  searchParams: URLSearchParams,
) {
  const returnTo = safeRelativeReturnPath(searchParams.get("returnTo"));
  const intent = searchParams.get("intent");

  if (!returnTo || (intent !== "price_watch" && intent !== "save_comparison")) return authPath;

  return `${authPath}?${new URLSearchParams({ returnTo, intent }).toString()}`;
}

function parsePendingIntent(value: unknown, now: number): PendingIntent | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (!validExpiry(value.expiresAt, now)) return null;
  if (typeof value.returnTo !== "string" || !safeRelativeReturnPath(value.returnTo)) return null;

  if (value.kind === "price_watch") return parsePriceWatchIntent(value);
  if (value.kind === "save_comparison") return parseSaveComparisonIntent(value);
  return null;
}

function parsePriceWatchIntent(value: Record<string, unknown>): PriceWatchIntent | null {
  if (
    !hasExactKeys(value, [
      "amount",
      "currency",
      "expiresAt",
      "kind",
      "productId",
      "returnTo",
      "ruleType",
      "version",
    ]) ||
    !nonEmptyString(value.productId) ||
    !nonEmptyString(value.currency) ||
    !/^[A-Z]{3}$/u.test(value.currency) ||
    (value.amount !== null && typeof value.amount !== "string") ||
    typeof value.ruleType !== "string" ||
    !PRICE_WATCH_RULE_TYPES.has(value.ruleType as PriceWatchRuleType)
  ) {
    return null;
  }

  return value as PriceWatchIntent;
}

function parseSaveComparisonIntent(value: Record<string, unknown>): SaveComparisonIntent | null {
  if (
    !hasExactKeys(value, ["expiresAt", "kind", "productIds", "returnTo", "version"]) ||
    !Array.isArray(value.productIds) ||
    value.productIds.length < 1 ||
    value.productIds.length > 3 ||
    !value.productIds.every(nonEmptyString)
  ) {
    return null;
  }

  return value as SaveComparisonIntent;
}

function validExpiry(value: unknown, now: number) {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > now &&
    value <= now + PENDING_INTENT_MAX_LIFETIME_MS
  );
}

function hasExactKeys(value: Record<string, unknown>, expectedKeys: readonly string[]) {
  const keys = Object.keys(value).sort();
  return (
    keys.length === expectedKeys.length && keys.every((key, index) => key === expectedKeys[index])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function browserSessionStorage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function browserOrigin() {
  return typeof window === "undefined" ? "http://localhost" : window.location.origin;
}
