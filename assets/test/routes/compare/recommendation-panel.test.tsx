import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay";
import { RecommendationPanel } from "../../../src/routes/compare/RecommendationPanel";
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
    expect(screen.getByText("Based on the current price and 2 verified product details.")).toBeVisible();
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
    expect(screen.getByText("Products do not share one eligible offer currency.")).toBeVisible();
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
