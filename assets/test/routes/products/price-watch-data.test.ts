import {
  buildCreatePriceWatchInput,
  getPriceWatchAmountFieldData,
  PRICE_WATCH_CREATED_MESSAGE,
  priceWatchRuleTypeFromValue,
  resolveCreatePriceWatchMutationMessage,
  type PriceWatchInputSource
} from "../../../src/routes/products/price-watch-data";

const MUTATION_ERROR = {
  code: "INVALID_ARGUMENT",
  field: "targetAmount",
  message: "Target amount is invalid."
};
const GRAPHQL_ERROR = { message: "Transport-level GraphQL error" };

test.each([
  "TARGET_PRICE",
  "PERCENTAGE_DROP",
  "BACK_IN_STOCK",
  "NEWLY_AVAILABLE"
] as const)("priceWatchRuleTypeFromValue preserves supported value %s", (value) => {
  expect(priceWatchRuleTypeFromValue(value)).toBe(value);
});

test.each(["", "UNKNOWN", "FUTURE_RULE"])(
  "priceWatchRuleTypeFromValue falls back for unsupported value %s",
  (value) => {
    expect(priceWatchRuleTypeFromValue(value)).toBe("TARGET_PRICE");
  }
);

test.each([
  ["TARGET_PRICE", { visible: true, label: "Target landed price" }],
  ["PERCENTAGE_DROP", { visible: true, label: "Percentage drop" }],
  ["BACK_IN_STOCK", { visible: false, label: null }],
  ["NEWLY_AVAILABLE", { visible: false, label: null }]
] as const)("getPriceWatchAmountFieldData projects the %s amount field", (ruleType, expected) => {
  expect(getPriceWatchAmountFieldData(ruleType)).toEqual(expected);
});

test.each([
  ["TARGET_PRICE", { targetAmount: "75.50" }],
  ["PERCENTAGE_DROP", { percentageDrop: "75.50" }],
  ["BACK_IN_STOCK", {}],
  ["NEWLY_AVAILABLE", {}]
] as const)("buildCreatePriceWatchInput builds the %s rule input", (ruleType, amountField) => {
  expect(buildCreatePriceWatchInput({
    productId: "product-1",
    ruleType,
    amount: " 75.50 ",
    currency: " eur "
  })).toEqual({
    productId: "product-1",
    ruleType,
    currency: "EUR",
    ...amountField
  });
});

test("buildCreatePriceWatchInput defaults a nullish currency but keeps an explicit empty currency", () => {
  expect(buildCreatePriceWatchInput({
    productId: "product-1",
    ruleType: "BACK_IN_STOCK",
    amount: null,
    currency: null
  })).toMatchObject({ currency: "USD" });

  expect(buildCreatePriceWatchInput({
    productId: "product-1",
    ruleType: "NEWLY_AVAILABLE",
    amount: null,
    currency: ""
  })).toMatchObject({ currency: "" });
});

test("buildCreatePriceWatchInput does not mutate its scalar input source", () => {
  const source: PriceWatchInputSource = {
    productId: "product-1",
    ruleType: "PERCENTAGE_DROP",
    amount: " 20 ",
    currency: " cad "
  };
  const frozenSource = Object.freeze(source);

  const result = buildCreatePriceWatchInput(frozenSource);

  expect(result).toEqual({
    productId: "product-1",
    ruleType: "PERCENTAGE_DROP",
    currency: "CAD",
    percentageDrop: "20"
  });
  expect(frozenSource).toEqual({
    productId: "product-1",
    ruleType: "PERCENTAGE_DROP",
    amount: " 20 ",
    currency: " cad "
  });
});

test("create-watch completion returns success for a complete error-free payload", () => {
  const payload = Object.freeze({
    watch: Object.freeze({ id: "watch-1" }),
    errors: Object.freeze([])
  });
  const graphQLErrors = Object.freeze([]);

  expect(resolveCreatePriceWatchMutationMessage(payload, graphQLErrors)).toBe(
    PRICE_WATCH_CREATED_MESSAGE
  );
  expect(PRICE_WATCH_CREATED_MESSAGE).toBe(
    "Watch created. New qualifying changes will appear in your inbox."
  );
  expect(payload).toEqual({ watch: { id: "watch-1" }, errors: [] });
  expect(graphQLErrors).toEqual([]);
});

test.each([
  ["missing payload", undefined, [], "Request failed. Please try again."],
  ["null payload", null, [], "Request failed. Please try again."],
  ["missing watch", {}, [], "Request failed. Please try again."],
  [
    "null watch with a payload error",
    { watch: null, errors: [MUTATION_ERROR] },
    [],
    MUTATION_ERROR.message
  ],
  [
    "complete watch with a top-level GraphQL error",
    { watch: { id: "watch-1" }, errors: [] },
    [GRAPHQL_ERROR],
    "Request failed. Please try again."
  ]
] as const)("create-watch completion handles a %s", (_case, payload, graphQLErrors, message) => {
  expect(resolveCreatePriceWatchMutationMessage(payload, graphQLErrors)).toBe(message);
});
