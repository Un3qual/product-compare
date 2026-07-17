import {
  buildSharedComparisonViewData,
  type SharedComparisonSnapshotInput
} from "../../../src/routes/compare/shared/shared-comparison-view-data";

test("projects the captured winner, source-backed facts, and ordered live path", () => {
  const snapshot = deepFreeze(
    snapshotInput({
      products: [
        {
          id: "product-2",
          name: "Second camera",
          slug: "second-camera",
          description: "Compact travel camera",
          brandName: "Acme",
          modelNumber: "C2",
          attributes: [
            {
              claimId: "claim-2",
              displayName: "Weight",
              valueText: "400 g",
              evidence: [{ sourceName: "Acme specifications" }]
            }
          ],
          offers: [
            {
              pricePointId: "point-2",
              merchantName: "Camera Shop",
              landedPrice: "90",
              currency: "USD",
              observedAt: "2026-07-13T22:00:00Z"
            }
          ]
        },
        {
          id: "product-1",
          name: "First camera",
          slug: "first-camera",
          description: null,
          brandName: "Bravo",
          modelNumber: null,
          attributes: [],
          offers: []
        }
      ],
      recommendation: {
        algorithmVersion: "lowest-v1",
        evaluatedAt: "2026-07-13T23:00:00Z",
        winnerProductId: "product-2",
        missingInputs: [],
        rankings: [
          {
            productId: "product-1",
            productName: "First camera",
            reasons: ["Higher current cost"]
          },
          {
            productId: "product-2",
            productName: "Second camera",
            reasons: ["Lowest current cost", "Fresh observation"]
          }
        ]
      }
    })
  );

  expect(buildSharedComparisonViewData(snapshot)).toEqual({
    capturedAt: "2026-07-13T23:00:00Z",
    disclaimer: "This is a captured snapshot.",
    liveComparisonPath: "/compare?slug=second-camera&slug=first-camera",
    products: [
      {
        id: "product-2",
        name: "Second camera",
        description: "Compact travel camera",
        brandModelLabel: "Acme · C2",
        attributes: [
          {
            claimId: "claim-2",
            displayName: "Weight",
            valueText: "400 g",
            evidenceLabel: "Accepted claim claim-2 · Acme specifications"
          }
        ],
        offers: [
          {
            pricePointId: "point-2",
            label: "Camera Shop: 90 USD landed",
            observedAt: "2026-07-13T22:00:00Z"
          }
        ]
      },
      {
        id: "product-1",
        name: "First camera",
        description: null,
        brandModelLabel: "Bravo",
        attributes: [],
        offers: []
      }
    ],
    recommendation: {
      algorithmVersion: "lowest-v1",
      evaluatedAt: "2026-07-13T23:00:00Z",
      kind: "winner",
      label: "Second camera",
      reasons: ["Lowest current cost", "Fresh observation"]
    },
    title: "Camera shortlist"
  });
});

test("uses exact unsupported, product, claim, and offer fallbacks", () => {
  const viewData = buildSharedComparisonViewData(
    snapshotInput({
      title: null,
      recommendation: {
        algorithmVersion: "best-value-v1",
        evaluatedAt: "2026-07-13T23:00:00Z",
        winnerProductId: "missing-product",
        missingInputs: ["Accepted specification evidence is unavailable"],
        rankings: []
      },
      products: [
        {
          id: "product-1",
          name: "Unbranded camera",
          slug: "unbranded-camera",
          description: "",
          brandName: null,
          modelNumber: "",
          attributes: [
            {
              claimId: "claim-1",
              displayName: "Resolution",
              valueText: "24 MP",
              evidence: []
            }
          ],
          offers: [
            {
              pricePointId: "point-1",
              merchantName: null,
              landedPrice: null,
              currency: null,
              observedAt: null
            }
          ]
        }
      ]
    })
  );

  expect(viewData.title).toBe("Shared product comparison");
  expect(viewData.recommendation).toEqual({
    algorithmVersion: "best-value-v1",
    evaluatedAt: "2026-07-13T23:00:00Z",
    kind: "unsupported",
    label: "No supported winner",
    reasons: ["Accepted specification evidence is unavailable"]
  });
  expect(viewData.products).toEqual([
    {
      id: "product-1",
      name: "Unbranded camera",
      description: null,
      brandModelLabel: "Unknown brand",
      attributes: [
        {
          claimId: "claim-1",
          displayName: "Resolution",
          valueText: "24 MP",
          evidenceLabel: "Accepted claim claim-1"
        }
      ],
      offers: [
        {
          pricePointId: "point-1",
          label: "Unknown merchant: Landed price unavailable",
          observedAt: null
        }
      ]
    }
  ]);
});

test("treats nullable collections as empty without mutating nested input", () => {
  const snapshot = deepFreeze(
    snapshotInput({
      products: [
        {
          id: "product-1",
          name: "Camera",
          slug: "camera",
          description: null,
          brandName: null,
          modelNumber: null,
          attributes: null,
          offers: undefined
        }
      ],
      recommendation: {
        algorithmVersion: "lowest-v1",
        evaluatedAt: "2026-07-13T23:00:00Z",
        winnerProductId: null,
        missingInputs: null,
        rankings: undefined
      }
    })
  );
  const before = structuredClone(snapshot);

  const viewData = buildSharedComparisonViewData(snapshot);

  expect(viewData.recommendation).toMatchObject({
    kind: "unsupported",
    reasons: []
  });
  expect(viewData.products[0]).toMatchObject({ attributes: [], offers: [] });
  expect(viewData.liveComparisonPath).toBe("/compare?slug=camera");
  expect(snapshot).toEqual(before);
});

test("returns empty product facts and the base compare path for a missing collection", () => {
  const viewData = buildSharedComparisonViewData(
    snapshotInput({ products: null })
  );

  expect(viewData.products).toEqual([]);
  expect(viewData.liveComparisonPath).toBe("/compare");
});

function snapshotInput(
  overrides: Partial<SharedComparisonSnapshotInput> = {}
): SharedComparisonSnapshotInput {
  return {
    capturedAt: "2026-07-13T23:00:00Z",
    disclaimer: "This is a captured snapshot.",
    title: "Camera shortlist",
    products: [],
    recommendation: {
      algorithmVersion: "lowest-v1",
      evaluatedAt: "2026-07-13T23:00:00Z",
      winnerProductId: null,
      missingInputs: [],
      rankings: []
    },
    ...overrides
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);

    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue);
    }
  }

  return value;
}
