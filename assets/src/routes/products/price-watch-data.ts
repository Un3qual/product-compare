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

export const PRICE_WATCH_CREATED_MESSAGE =
  "Watch created. New qualifying changes will appear in your inbox.";

export function resolveCreatePriceWatchMutationMessage(
  payload: CreatePriceWatchPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return payload?.watch && !hasRouteGraphQLErrors(graphQLErrors)
    ? PRICE_WATCH_CREATED_MESSAGE
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function needsPriceWatchAmount(ruleType: PriceWatchRuleType) {
  return ruleType === "TARGET_PRICE" || ruleType === "PERCENTAGE_DROP";
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
