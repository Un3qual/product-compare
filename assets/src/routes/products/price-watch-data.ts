import {
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../route-errors";

export type PriceWatchRuleType =
  | "TARGET_PRICE"
  | "PERCENTAGE_DROP"
  | "BACK_IN_STOCK"
  | "NEWLY_AVAILABLE";

export type PriceWatchInputSource = Readonly<{
  productId: string;
  ruleType: PriceWatchRuleType;
  amount: unknown;
  currency: unknown;
}>;

export type CreatePriceWatchInput = {
  productId: string;
  ruleType: PriceWatchRuleType;
  currency: string;
  targetAmount?: string;
  percentageDrop?: string;
};

export type CreatePriceWatchPayload = {
  readonly errors?: unknown;
  readonly watch?: unknown;
};

export type PriceWatchAmountFieldData =
  | Readonly<{ visible: true; label: "Target landed price" | "Percentage drop" }>
  | Readonly<{ visible: false; label: null }>;

export const PRICE_WATCH_CREATED_MESSAGE =
  "Watch created. New qualifying changes will appear in your inbox.";

export function priceWatchRuleTypeFromValue(value: string): PriceWatchRuleType {
  switch (value) {
    case "TARGET_PRICE":
    case "PERCENTAGE_DROP":
    case "BACK_IN_STOCK":
    case "NEWLY_AVAILABLE":
      return value;
    default:
      return "TARGET_PRICE";
  }
}

export function resolveCreatePriceWatchMutationMessage(
  payload: CreatePriceWatchPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return payload?.watch && !hasRouteGraphQLErrors(graphQLErrors)
    ? PRICE_WATCH_CREATED_MESSAGE
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function getPriceWatchAmountFieldData(
  ruleType: PriceWatchRuleType
): PriceWatchAmountFieldData {
  switch (ruleType) {
    case "TARGET_PRICE":
      return { visible: true, label: "Target landed price" };
    case "PERCENTAGE_DROP":
      return { visible: true, label: "Percentage drop" };
    default:
      return { visible: false, label: null };
  }
}

export function buildCreatePriceWatchInput({
  productId,
  ruleType,
  amount: rawAmount,
  currency: rawCurrency
}: PriceWatchInputSource): CreatePriceWatchInput {
  const amount = String(rawAmount ?? "").trim();
  const currency = String(rawCurrency ?? "USD").trim().toUpperCase();

  return {
    productId,
    ruleType,
    currency,
    ...(ruleType === "TARGET_PRICE" ? { targetAmount: amount } : {}),
    ...(ruleType === "PERCENTAGE_DROP" ? { percentageDrop: amount } : {})
  };
}
