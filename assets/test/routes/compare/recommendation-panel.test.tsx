import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecommendationPanel } from "../../../src/routes/compare/RecommendationPanel";
import {
  recommendationProfileFromUrl,
  type CompareRecommendationSummary
} from "../../../src/routes/compare/loader";

const WINNER: CompareRecommendationSummary = {
  profile: "best_value",
  algorithmVersion: "best-supported-current-cost-v1",
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
      reasons: ["Lowest eligible landed price: USD 119.00"]
    }
  ]
};

describe("RecommendationPanel", () => {
  it("shows the winner with exact evidence and preserves comparison controls", () => {
    render(
      <MemoryRouter>
        <RecommendationPanel
          recommendation={WINNER}
          slugs={["evidence-camera", "other-camera"]}
          specMode="differences"
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Evidence Camera")).toBeVisible();
    expect(screen.getByText(/price observation price-point-4/)).toBeVisible();
    expect(screen.getByText(/2 accepted claim references/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Lowest current cost" })).toHaveAttribute(
      "href",
      "/compare?slug=evidence-camera&slug=other-camera&specs=differences"
    );
    expect(screen.getByRole("link", { name: "Best supported value" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("explains why no supported winner is available", () => {
    render(
      <MemoryRouter>
        <RecommendationPanel
          recommendation={{
            ...WINNER,
            status: "INSUFFICIENT_EVIDENCE",
            winnerProductId: null,
            rankings: [],
            missingInputs: ["Products do not share one eligible offer currency."]
          }}
          slugs={["one", "two"]}
          specMode="shared"
        />
      </MemoryRouter>
    );

    expect(screen.getByText("No supported winner")).toBeVisible();
    expect(
      screen.getByText("Products do not share one eligible offer currency.")
    ).toBeVisible();
  });
});

describe("recommendationProfileFromUrl", () => {
  it("defaults unknown profiles to lowest current cost", () => {
    expect(recommendationProfileFromUrl("https://example.test/compare?recommend=unknown")).toBe(
      "lowest_current_cost"
    );
  });

  it("accepts the best value profile", () => {
    expect(
      recommendationProfileFromUrl("https://example.test/compare?recommend=best_value")
    ).toBe("best_value");
  });
});
