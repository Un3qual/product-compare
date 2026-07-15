import {
  buildCreatePriceWatchInput,
  needsPriceWatchAmount,
  type PriceWatchInputSource
} from "../../../src/routes/products/price-watch-data";

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
