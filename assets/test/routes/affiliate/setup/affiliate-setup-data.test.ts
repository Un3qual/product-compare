import {
  buildCouponVariables,
  buildLinkVariables,
  buildMerchantChoices,
  buildNetworkVariables,
  buildProgramVariables,
  couponDiscountText,
  getAffiliateMerchantContext,
  getMerchantChoiceById,
  getMerchantSummary,
  resolveAffiliateCouponMutationOutcome,
  resolveAffiliateLinkMutationOutcome,
  resolveAffiliateNetworkMutationOutcome,
  resolveAffiliateProgramMutationOutcome
} from "../../../../src/routes/affiliate/setup/affiliate-setup-data";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../../src/routes/route-errors";

const FIRST_MERCHANT = {
  id: "merchant-1",
  name: "Acme Market",
  domain: "acme.example"
};

test.each([
  [
    "formats amount discounts with a value and currency",
    { discountType: "AMOUNT", discountValue: "20.00", currency: "USD" },
    "20.00 USD"
  ],
  [
    "hides amount discounts with currency but no value",
    { discountType: "AMOUNT", currency: "USD" },
    null
  ],
  [
    "hides amount discounts with a value but no currency",
    { discountType: "AMOUNT", discountValue: "20.00" },
    null
  ],
  [
    "hides amount discounts with a blank value",
    { discountType: "AMOUNT", discountValue: "", currency: "USD" },
    null
  ],
  [
    "hides amount discounts with a blank currency",
    { discountType: "AMOUNT", discountValue: "20.00", currency: "" },
    null
  ],
  [
    "hides amount discounts with a nullish value",
    { discountType: "AMOUNT", discountValue: null, currency: "USD" },
    null
  ],
  [
    "formats percent discounts with a value",
    { discountType: "PERCENT", discountValue: "15" },
    "15% off"
  ],
  [
    "hides percent discounts with a blank value",
    { discountType: "PERCENT", discountValue: "" },
    null
  ],
  ["formats free-shipping discounts", { discountType: "FREE_SHIPPING" }, "Free shipping"],
  [
    "formats other discounts with a value",
    { discountType: "OTHER", discountValue: "Member reward" },
    "Member reward off"
  ],
  [
    "uses the other discount fallback for a blank value",
    { discountType: "OTHER", discountValue: "" },
    "Other discount"
  ],
  [
    "uses the other discount fallback for a nullish value",
    { discountType: "OTHER", discountValue: null },
    "Other discount"
  ],
  [
    "hides unknown future discount types",
    { discountType: "BUY_ONE_GET_ONE", discountValue: "1" },
    null
  ]
] as const)("couponDiscountText %s", (_description, coupon, expected) => {
  expect(couponDiscountText(coupon)).toBe(expected);
});

const MUTATION_ERROR = {
  code: "INVALID_ARGUMENT",
  field: "name",
  message: "Affiliate data is invalid."
} as const;

const GRAPHQL_ERROR = { message: "Private GraphQL failure" } as const;

test("buildMerchantChoices filters invalid merchant nodes while preserving valid choices", () => {
  expect(
    buildMerchantChoices({
      edges: [
        { node: FIRST_MERCHANT },
        { node: { ...FIRST_MERCHANT, id: "" } },
        { node: { ...FIRST_MERCHANT, name: "" } },
        { node: { ...FIRST_MERCHANT, domain: "" } },
        { node: null }
      ]
    })
  ).toEqual([FIRST_MERCHANT]);
  expect(buildMerchantChoices(null)).toEqual([]);
});

test("merchant selection and summaries return the matched choice or no summary", () => {
  const merchantChoices = [FIRST_MERCHANT];

  expect(getMerchantChoiceById(merchantChoices, FIRST_MERCHANT.id)).toEqual(FIRST_MERCHANT);
  expect(getMerchantChoiceById(merchantChoices, "missing")).toBeUndefined();
  expect(getMerchantSummary(FIRST_MERCHANT)).toBe("Acme Market (acme.example)");
  expect(getMerchantSummary()).toBeNull();
});

test("affiliate merchant context owns the selected and current merchant copy", () => {
  const merchantChoices = [FIRST_MERCHANT];

  expect(getAffiliateMerchantContext(merchantChoices, FIRST_MERCHANT.id)).toEqual({
    currentMerchantCopy: "Current merchant: Acme Market (acme.example)",
    selectedMerchantCopy: "Selected merchant: Acme Market (acme.example)",
    selectedMerchantValue: FIRST_MERCHANT.id
  });
  expect(getAffiliateMerchantContext(merchantChoices, "missing")).toEqual({
    currentMerchantCopy: "Current merchant: Acme Market (acme.example)",
    selectedMerchantCopy: "Selected merchant: Acme Market (acme.example)",
    selectedMerchantValue: FIRST_MERCHANT.id
  });
  expect(getAffiliateMerchantContext([], "missing")).toEqual({
    currentMerchantCopy: null,
    selectedMerchantCopy: null,
    selectedMerchantValue: ""
  });
});

test("buildNetworkVariables trims the required network name", () => {
  expect(buildNetworkVariables({ networkName: "  Impact  " })).toEqual({
    input: {
      name: "Impact"
    }
  });
});

test("buildProgramVariables trims required values and converts blank optional values to null", () => {
  expect(
    buildProgramVariables({
      affiliateNetworkId: "  network-1  ",
      merchantId: "  merchant-1  ",
      programCode: "  ",
      programStatus: "  active  "
    })
  ).toEqual({
    input: {
      affiliateNetworkId: "network-1",
      merchantId: "merchant-1",
      programCode: null,
      status: "active"
    }
  });
});

test("buildLinkVariables normalizes optional datetimes and rejects invalid dates", () => {
  expect(
    buildLinkVariables({
      merchantProductId: "  product-1  ",
      linkAffiliateNetworkId: "  ",
      originalUrl: "  https://merchant.example/product  ",
      affiliateUrl: "  https://network.example/track  ",
      lastVerifiedAt: "2026-06-01T12:30"
    })
  ).toEqual({
    input: {
      merchantProductId: "product-1",
      affiliateNetworkId: null,
      originalUrl: "https://merchant.example/product",
      affiliateUrl: "https://network.example/track",
      lastVerifiedAt: new Date("2026-06-01T12:30").toISOString()
    }
  });
  expect(
    buildLinkVariables({
      merchantProductId: "product-1",
      originalUrl: "https://merchant.example/product",
      affiliateUrl: "https://network.example/track",
      lastVerifiedAt: "not-a-date"
    }).input.lastVerifiedAt
  ).toBeNull();
});

test("buildCouponVariables preserves the full mutation shape and normalizes optional values", () => {
  expect(
    buildCouponVariables({
      couponMerchantId: "  merchant-1  ",
      couponAffiliateNetworkId: "  network-1  ",
      couponCode: "  SAVE-20  ",
      couponDescription: "  Summer promotion  ",
      discountType: "AMOUNT",
      discountValue: "  20.00  ",
      currency: " usd ",
      validFrom: "2026-06-01T00:00",
      validTo: "not-a-date",
      terms: "  Select items only  "
    })
  ).toEqual({
    input: {
      merchantId: "merchant-1",
      affiliateNetworkId: "network-1",
      artifactId: null,
      code: "SAVE-20",
      description: "Summer promotion",
      discountType: "AMOUNT",
      discountValue: "20.00",
      currency: "USD",
      validFrom: new Date("2026-06-01T00:00").toISOString(),
      validTo: null,
      terms: "Select items only"
    }
  });
});

test("affiliate setup mutation outcomes preserve each complete fact and its identity", () => {
  const network = Object.freeze({ id: "network-1", name: "Impact" });
  const program = Object.freeze({ id: "program-1", merchantId: "merchant-1" });
  const link = Object.freeze({ id: "link-1", affiliateUrl: "https://network.example/track" });
  const coupon = Object.freeze({ id: "coupon-1", code: "SAVE20" });
  const errors = Object.freeze([MUTATION_ERROR]);

  const outcomes = [
    [network, resolveAffiliateNetworkMutationOutcome({ network, errors }, [])],
    [program, resolveAffiliateProgramMutationOutcome({ program, errors }, [])],
    [link, resolveAffiliateLinkMutationOutcome({ link, errors }, [])],
    [coupon, resolveAffiliateCouponMutationOutcome({ coupon, errors }, [])]
  ] as const;

  for (const [fact, outcome] of outcomes) {
    expect(outcome).toEqual({ error: null, result: fact });
    expect(outcome.result).toBe(fact);
  }
  expect(errors).toEqual([MUTATION_ERROR]);
});

test.each([
  [
    "network",
    () => resolveAffiliateNetworkMutationOutcome(undefined, []),
    () => resolveAffiliateNetworkMutationOutcome({ network: null, errors: [MUTATION_ERROR] }, [])
  ],
  [
    "program",
    () => resolveAffiliateProgramMutationOutcome(null, []),
    () => resolveAffiliateProgramMutationOutcome({ program: null, errors: [MUTATION_ERROR] }, [])
  ],
  [
    "link",
    () => resolveAffiliateLinkMutationOutcome({}, []),
    () => resolveAffiliateLinkMutationOutcome({ link: null, errors: [MUTATION_ERROR] }, [])
  ],
  [
    "coupon",
    () => resolveAffiliateCouponMutationOutcome(undefined, []),
    () => resolveAffiliateCouponMutationOutcome({ coupon: null, errors: [MUTATION_ERROR] }, [])
  ]
] as const)(
  "%s outcome uses shared errors for missing payloads and null facts",
  (_kind, resolveMissing, resolveNullFact) => {
    expect(resolveMissing()).toEqual({ error: DEFAULT_ROUTE_ERROR_MESSAGE, result: null });
    expect(resolveNullFact()).toEqual({ error: MUTATION_ERROR.message, result: null });
  }
);

test.each([
  [
    "network",
    () =>
      resolveAffiliateNetworkMutationOutcome(
        { network: { id: "network-1" }, errors: [MUTATION_ERROR] },
        [GRAPHQL_ERROR]
      )
  ],
  [
    "program",
    () =>
      resolveAffiliateProgramMutationOutcome(
        { program: { id: "program-1" }, errors: [MUTATION_ERROR] },
        [GRAPHQL_ERROR]
      )
  ],
  [
    "link",
    () =>
      resolveAffiliateLinkMutationOutcome(
        { link: { id: "link-1" }, errors: [MUTATION_ERROR] },
        [GRAPHQL_ERROR]
      )
  ],
  [
    "coupon",
    () =>
      resolveAffiliateCouponMutationOutcome(
        { coupon: { id: "coupon-1" }, errors: [MUTATION_ERROR] },
        [GRAPHQL_ERROR]
      )
  ]
] as const)("%s outcome gives top-level GraphQL errors precedence", (_kind, resolveOutcome) => {
  expect(resolveOutcome()).toEqual({ error: DEFAULT_ROUTE_ERROR_MESSAGE, result: null });
});
