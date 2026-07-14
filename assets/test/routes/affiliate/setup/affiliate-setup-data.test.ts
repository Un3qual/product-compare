import {
  buildCouponVariables,
  buildLinkVariables,
  buildMerchantChoices,
  buildNetworkVariables,
  buildProgramVariables,
  getMerchantChoiceById,
  getMerchantSummary
} from "../../../../src/routes/affiliate/setup/affiliate-setup-data";

const FIRST_MERCHANT = {
  id: "merchant-1",
  name: "Acme Market",
  domain: "acme.example"
};

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
