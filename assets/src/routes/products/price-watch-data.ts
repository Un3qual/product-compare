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
