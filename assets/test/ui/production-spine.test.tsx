import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CompareMark } from "../../src/ui/components/brand/CompareMark";
import { ComparisonContinuity } from "../../src/ui/components/compare/ComparisonContinuity";
import { ProductLedger } from "../../src/ui/components/products/ProductLedger";
import { RootPrimaryNavigation } from "../../src/routes/RootDestinations";

const themeCss = readFileSync("src/ui/theme/theme.css", "utf8");

test("production theme supplies the warm paper palette, data fonts, touch target, focus, and reduced-motion contract", () => {
  expect(themeCss).toContain("--pc-surface-canvas: #F4F1E9");
  expect(themeCss).toContain("--pc-surface-raised: #FFFCF7");
  expect(themeCss).toContain("--pc-surface-muted: #ECE7DC");
  expect(themeCss).toContain("--pc-action-accent: #2F62D7");
  expect(themeCss).toContain("--pc-price-positive: #1F6B49");
  expect(themeCss).toContain('"Instrument Sans Variable"');
  expect(themeCss).toContain('"IBM Plex Mono"');
  expect(themeCss).toContain("--pc-control-height: 2.75rem");
  expect(themeCss).toContain(":focus-visible");
  expect(themeCss).toContain("prefers-reduced-motion: reduce");
});

test("comparison continuity presents normalized selections as numbered labels and a canonical action", () => {
  render(
    <MemoryRouter>
      <ComparisonContinuity
        destination="/compare?slug=alpha&slug=beta"
        products={[
          { label: "Alpha Camera", slug: "alpha" },
          { label: "Beta Camera", slug: "beta" }
        ]}
      />
    </MemoryRouter>
  );

  const continuity = screen.getByRole("region", { name: "Comparison selection" });
  expect(within(continuity).getByRole("list")).toBeInTheDocument();
  expect(within(continuity).getByText("1. Alpha Camera")).toBeInTheDocument();
  expect(within(continuity).getByText("2. Beta Camera")).toBeInTheDocument();
  expect(within(continuity).getByRole("link", { name: "Open comparison" })).toHaveAttribute(
    "href",
    "/compare?slug=alpha&slug=beta"
  );
});

test("product ledger keeps all product facts in one semantic list with a disclosed secondary detail", () => {
  render(
    <ProductLedger
      rows={[
        {
          actions: <a href="/products/alpha">View Alpha Camera</a>,
          category: "Cameras",
          freshness: "Last checked today",
          highlights: "24 MP · Weather sealed",
          id: "alpha",
          offer: "$849 at Example Store",
          priceSignal: "Lowest in 30 days",
          secondaryDetails: "Body weight: 520 g",
          title: "Alpha Camera"
        }
      ]}
      secondaryDisclosureLabel="More details"
    />
  );

  const ledger = screen.getByRole("list", { name: "Products" });
  expect(within(ledger).getAllByRole("article")).toHaveLength(1);
  expect(within(ledger).getByRole("heading", { name: "Alpha Camera" })).toBeInTheDocument();
  expect(within(ledger).getByRole("button", { name: "More details" })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  expect(within(ledger).getByRole("link", { name: "View Alpha Camera" })).toBeInTheDocument();
});

test("compare mark preserves the product identity without ornamental imagery", () => {
  render(<CompareMark label="Product Compare" />);

  expect(screen.getByLabelText("Product Compare")).toHaveTextContent("Product Compare");
});

test("responsive navigation keeps search and comparison direct while grouping guest, member, and operator destinations", () => {
  const { rerender } = render(
    <MemoryRouter>
      <RootPrimaryNavigation viewer={null} />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "Search products" })).toHaveAttribute(
    "href",
    "/products"
  );
  expect(screen.getByRole("link", { name: "Compare products" })).toHaveAttribute(
    "href",
    "/compare"
  );
  expect(screen.getByRole("button", { name: "Guest menu" })).toBeInTheDocument();

  rerender(
    <MemoryRouter>
      <RootPrimaryNavigation viewer={{ email: "member@example.com", id: "member-1", isOperator: false }} />
    </MemoryRouter>
  );
  expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Operator menu" })).not.toBeInTheDocument();

  rerender(
    <MemoryRouter>
      <RootPrimaryNavigation viewer={{ email: "operator@example.com", id: "operator-1", isOperator: true }} />
    </MemoryRouter>
  );
  expect(screen.getByRole("button", { name: "Operator menu" })).toBeInTheDocument();
});
