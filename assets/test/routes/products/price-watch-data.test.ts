import {
  buildCreatePriceWatchInput,
  needsPriceWatchAmount,
  PRICE_WATCH_CREATED_MESSAGE,
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
  ["TARGET_PRICE", true],
  ["PERCENTAGE_DROP", true],
  ["BACK_IN_STOCK", false],
  ["NEWLY_AVAILABLE", false]
] as const)("needsPriceWatchAmount identifies whether %s needs an amount", (ruleType, expected) => {
  expect(needsPriceWatchAmount(ruleType)).toBe(expected);
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

test("create-watch completion keeps exact success copy ahead of payload and GraphQL errors", () => {
  const payload = Object.freeze({
    watch: Object.freeze({ id: "watch-1" }),
    errors: Object.freeze([MUTATION_ERROR])
  });
  const graphQLErrors = Object.freeze([GRAPHQL_ERROR]);

  expect(resolveCreatePriceWatchMutationMessage(payload, graphQLErrors)).toBe(
    PRICE_WATCH_CREATED_MESSAGE
  );
  expect(PRICE_WATCH_CREATED_MESSAGE).toBe(
    "Watch created. New qualifying changes will appear in your inbox."
  );
  expect(payload).toEqual({ watch: { id: "watch-1" }, errors: [MUTATION_ERROR] });
  expect(graphQLErrors).toEqual([GRAPHQL_ERROR]);
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
    "missing watch with a top-level GraphQL error",
    { errors: [MUTATION_ERROR] },
    [GRAPHQL_ERROR],
    "Request failed. Please try again."
  ]
] as const)("create-watch completion handles a %s", (_case, payload, graphQLErrors, message) => {
  expect(resolveCreatePriceWatchMutationMessage(payload, graphQLErrors)).toBe(message);
});
