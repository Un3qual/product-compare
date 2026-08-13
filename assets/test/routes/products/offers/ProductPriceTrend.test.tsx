import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductPriceTrend } from "../../../../src/routes/products/offers/ProductPriceTrend";

const series = [
  {
    currency: "EUR",
    merchants: [{ id: "merchant-euro", merchantProductId: "offer-euro", name: "Euro Shop" }],
    points: [
      {
        averagePrice: "88",
        lowestMerchantProductId: "offer-euro",
        lowestPrice: "88",
        merchantPrices: [{ merchantProductId: "offer-euro", price: "88" }],
        observedAt: "2026-08-11T00:00:00Z",
      },
    ],
  },
  {
    currency: "USD",
    merchants: [
      { id: "merchant-alpha", merchantProductId: "offer-alpha", name: "Alpha Market" },
      { id: "merchant-beta", merchantProductId: "offer-beta", name: "Beta Market" },
    ],
    points: [
      {
        averagePrice: "110",
        lowestMerchantProductId: "offer-alpha",
        lowestPrice: "100",
        merchantPrices: [
          { merchantProductId: "offer-alpha", price: "100" },
          { merchantProductId: "offer-beta", price: "120" },
        ],
        observedAt: "2026-08-10T00:00:00Z",
      },
      {
        averagePrice: "105",
        lowestMerchantProductId: "offer-beta",
        lowestPrice: "90",
        merchantPrices: [
          { merchantProductId: "offer-alpha", price: "120" },
          { merchantProductId: "offer-beta", price: "90" },
        ],
        observedAt: "2026-08-11T00:00:00Z",
      },
    ],
  },
] as const;

test("switches between lowest, average, and merchant trend modes without hiding exact data", async () => {
  const user = userEvent.setup();

  render(<ProductPriceTrend series={series} />);

  expect(screen.getByRole("heading", { name: "Price trend" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Lowest" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("table", { name: "Lowest USD price trend data" })).toBeInTheDocument();
  expect(screen.getAllByText("Alpha Market")).not.toHaveLength(0);
  expect(screen.getAllByText("Beta Market")).not.toHaveLength(0);

  await user.click(screen.getByRole("button", { name: "Average" }));
  expect(screen.getByRole("table", { name: "Average USD price trend data" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "By merchant" }));
  expect(screen.getByRole("table", { name: "Merchant USD price trend data" })).toBeInTheDocument();
});

test("keeps currencies separated and changes the selected series explicitly", async () => {
  const user = userEvent.setup();

  render(<ProductPriceTrend series={series} />);

  await user.selectOptions(screen.getByRole("combobox", { name: "Currency" }), "EUR");

  expect(screen.getByRole("table", { name: "Lowest EUR price trend data" })).toBeInTheDocument();
  expect(screen.queryByText("Beta Market")).not.toBeInTheDocument();
  expect(screen.getAllByText("Euro Shop")).not.toHaveLength(0);
});
