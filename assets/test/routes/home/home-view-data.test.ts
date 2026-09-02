import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router";
import { HomeProductLedger } from "../../../src/routes/home/HomeProductLedger";

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useFragment: vi.fn((_fragment, fragmentRef) => fragmentRef),
  };
});

test("HomeProductLedger presents ordinary price-observation recency with an exact timestamp", () => {
  render(
    createElement(
      MemoryRouter,
      undefined,
      createElement(HomeProductLedger, {
        products: {
          edges: [
            {
              node: { id: "product-1", name: "Model 1", slug: "model-1" },
              highlights: [],
              offer: {
                merchantName: "Camera Shop",
                currency: "USD",
                landedPrice: "499.00",
                priceSignal: "BELOW_30_DAY_MEDIAN",
                observedAt: "2026-08-12T10:00:00Z",
              },
            },
          ],
        } as never,
        referenceTime: "2026-08-12T12:00:00Z",
        selectedSlugs: [],
      }),
    ),
  );

  const trigger = screen.getByRole("button", { name: "Last checked 2 hours ago" });

  expect(trigger).toHaveAttribute("title", "Aug 12, 2026, 10:00 AM UTC");
  expect(screen.getByText("Last checked 2 hours ago", { selector: "time" })).toHaveAttribute(
    "datetime",
    "2026-08-12T10:00:00Z",
  );
});
