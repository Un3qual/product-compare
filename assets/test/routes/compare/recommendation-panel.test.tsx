import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay";
import { RecommendationPanel } from "../../../src/routes/compare/live/RecommendationPanel";
import {
  recommendationProfileFromUrl,
  shouldRevalidateCompareLoader,
} from "../../../src/routes/compare/recommendation-route-data";

const { useLazyLoadQueryMock } = vi.hoisted(() => ({
  useLazyLoadQueryMock: vi.fn(),
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return { ...actual, useLazyLoadQuery: useLazyLoadQueryMock };
});

const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);

const WINNER = {
  profile: "BEST_VALUE",
  status: "WINNER",
  winnerProductId: "product-1",
  currency: "USD",
  missingInputs: [],
  rankings: [
    {
      rank: 1,
      productId: "product-1",
      productName: "Evidence Camera",
      landedPrice: "119.00",
      currency: "USD",
      pricePointId: "price-point-4",
      claimIds: ["claim-2", "claim-3"],
      reasons: ["Lowest eligible landed price: USD 119.00"],
    },
  ],
} as const;

beforeEach(() => {
  useLazyLoadQueryMock.mockReset();
  mockedUseLazyLoadQuery.mockReturnValue({ comparisonRecommendation: WINNER } as never);
});

describe("RecommendationPanel", () => {
  it("loads the selected profile and explains its buying recommendation without internal IDs", () => {
    render(
      <MemoryRouter initialEntries={["/compare?recommend=best_value"]}>
        <RecommendationPanel slugs={["evidence-camera", "other-camera"]} specMode="differences" />
      </MemoryRouter>,
    );

    expect(mockedUseLazyLoadQuery).toHaveBeenCalledWith(
      expect.anything(),
      {
        slugs: ["evidence-camera", "other-camera"],
        profile: "BEST_VALUE",
      },
      { fetchPolicy: "store-or-network" },
    );
    expect(screen.getByText("Evidence Camera")).toBeVisible();
    expect(screen.getByText("Lowest current total price: USD 119.00")).toBeVisible();
    expect(
      screen.getByText("Based on the current price and 2 verified product details."),
    ).toBeVisible();
    expect(screen.queryByText(/price-point-4|claim-2|algorithm/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lowest current cost" })).toHaveAttribute(
      "href",
      "/compare?slug=evidence-camera&slug=other-camera&specs=differences",
    );
    expect(screen.getByRole("link", { name: "Best supported value" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("explains why no supported winner is available", () => {
    mockedUseLazyLoadQuery.mockReturnValue({
      comparisonRecommendation: {
        ...WINNER,
        status: "INSUFFICIENT_EVIDENCE",
        winnerProductId: null,
        rankings: [],
        missingInputs: ["Products do not share one eligible offer currency."],
      },
    } as never);

    render(
      <MemoryRouter>
        <RecommendationPanel slugs={["one", "two"]} specMode="shared" />
      </MemoryRouter>,
    );

    expect(screen.getByText("No supported winner")).toBeVisible();
    expect(
      screen.getByText("These products do not have current prices in the same currency."),
    ).toBeVisible();
    expect(screen.queryByText(/eligible offer currency/i)).not.toBeInTheDocument();
  });

  it.each([
    [
      [
        "Products do not share one eligible offer currency.",
        "price_point_id=price-point-42 failed internal policy v3",
      ],
      [
        "These products do not have current prices in the same currency.",
        "More product or price details are needed before a winner can be recommended.",
      ],
    ],
    [[], ["More product or price details are needed before a winner can be recommended."]],
    [
      ["Top products have the same eligible landed price."],
      ["The leading products have the same current total price."],
    ],
    [
      ["Recommendations require two or three existing products."],
      ["Choose two or three available products to get a recommendation."],
    ],
    [["Unsupported recommendation profile."], ["This recommendation option is unavailable."]],
  ])("renders safe no-winner reasons for backend blockers", (missingInputs, expectedReasons) => {
    mockedUseLazyLoadQuery.mockReturnValue({
      comparisonRecommendation: {
        ...WINNER,
        winnerProductId: null,
        rankings: [],
        missingInputs,
      },
    } as never);

    render(
      <MemoryRouter>
        <RecommendationPanel slugs={["one", "two"]} specMode="shared" />
      </MemoryRouter>,
    );

    expect(screen.getByText("No supported winner")).toBeVisible();
    for (const reason of expectedReasons) expect(screen.getByText(reason)).toBeVisible();
    expect(screen.queryByText(/price_point_id|internal policy/i)).not.toBeInTheDocument();
  });

  it("uses the first matching ranking and exact product-detail count copy", () => {
    mockedUseLazyLoadQuery.mockReturnValue({
      comparisonRecommendation: {
        ...WINNER,
        rankings: [
          { ...WINNER.rankings[0], productName: "First winner", claimIds: [] },
          { ...WINNER.rankings[0], productName: "Second winner", claimIds: ["claim-1"] },
        ],
      },
    } as never);

    render(
      <MemoryRouter>
        <RecommendationPanel slugs={["one", "two"]} specMode="shared" />
      </MemoryRouter>,
    );

    expect(screen.getByText("First winner", { selector: "strong" })).toBeVisible();
    expect(screen.queryByText("Second winner", { selector: "strong" })).not.toBeInTheDocument();
    expect(
      screen.getByText("Based on the current price and 0 verified product details."),
    ).toBeVisible();
  });

  it.each([
    [["claim-1"], "Based on the current price and 1 verified product detail."],
    [
      ["claim-1", "claim-2", "claim-3"],
      "Based on the current price and 3 verified product details.",
    ],
  ])("uses exact singular and plural product-detail copy", (claimIds, details) => {
    mockedUseLazyLoadQuery.mockReturnValue({
      comparisonRecommendation: {
        ...WINNER,
        rankings: [{ ...WINNER.rankings[0], claimIds }],
      },
    } as never);

    render(
      <MemoryRouter>
        <RecommendationPanel slugs={["one", "two"]} specMode="shared" />
      </MemoryRouter>,
    );

    expect(screen.getByText(details)).toBeVisible();
  });
});

describe("recommendation profile navigation", () => {
  it("defaults unknown profiles to lowest current cost", () => {
    expect(recommendationProfileFromUrl("https://example.test/compare?recommend=unknown")).toBe(
      "lowest_current_cost",
    );
  });

  it("accepts the best value profile", () => {
    expect(recommendationProfileFromUrl("https://example.test/compare?recommend=best_value")).toBe(
      "best_value",
    );
  });

  it("does not refetch the core comparison when only the profile changes", () => {
    expect(
      shouldRevalidateCompareLoader({
        currentUrl: new URL("https://example.test/compare?slug=one&slug=two"),
        nextUrl: new URL("https://example.test/compare?slug=one&slug=two&recommend=best_value"),
        defaultShouldRevalidate: true,
      } as never),
    ).toBe(false);

    expect(
      shouldRevalidateCompareLoader({
        currentUrl: new URL("https://example.test/compare?slug=one&slug=two"),
        nextUrl: new URL("https://example.test/compare?slug=one&slug=three"),
        defaultShouldRevalidate: true,
      } as never),
    ).toBe(true);

    expect(
      shouldRevalidateCompareLoader({
        currentUrl: new URL("https://example.test/compare?slug=one&slug=two"),
        nextUrl: new URL("https://example.test/compare?slug=one&slug=two"),
        defaultShouldRevalidate: true,
      } as never),
    ).toBe(true);
  });
});
