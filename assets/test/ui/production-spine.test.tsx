import { readFileSync } from "node:fs";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CompareMark } from "../../src/ui/components/brand/CompareMark";
import { ComparisonContinuity } from "../../src/ui/components/compare/ComparisonContinuity";
import { ProductLedger } from "../../src/ui/components/products/ProductLedger";
import { RootPrimaryNavigation } from "../../src/routes/RootDestinations";
import { AppShell } from "../../src/ui/components/layout/AppShell";
import { Button } from "../../src/ui/primitives/Button";
import { TextField } from "../../src/ui/primitives/TextField";

const themeCss = readFileSync("src/ui/theme/theme.css", "utf8");
const productLedgerSource = readFileSync("src/ui/components/products/ProductLedger.tsx", "utf8");

function installProductionTheme() {
  const style = document.createElement("style");
  style.textContent = themeCss;
  document.head.append(style);
  return style;
}

function expectVisibleFocusRule(style: HTMLStyleElement, element: HTMLElement) {
  const slot = element.dataset.slot;
  expect(slot).toBeDefined();

  const selector = `[data-slot="${slot}"]:focus-visible`;
  const rule = Array.from(style.sheet?.cssRules ?? []).find(
    (candidate): candidate is CSSStyleRule =>
      candidate instanceof CSSStyleRule && candidate.selectorText.includes(selector),
  );

  expect(rule).toBeDefined();
  expect(rule?.style.outline).toBe("2px solid var(--pc-brand-500)");
}

test("production theme supplies the warm paper palette, fonts, and explicit freshness semantics", () => {
  expect(themeCss).toContain("--pc-surface-canvas: #F4F1E9");
  expect(themeCss).toContain("--pc-surface-raised: #FFFCF7");
  expect(themeCss).toContain("--pc-surface-muted: #ECE7DC");
  expect(themeCss).toContain("--pc-action-accent: #2F62D7");
  expect(themeCss).toContain("--pc-text-secondary: #625D54");
  expect(themeCss).toContain("--pc-freshness-soft: #E8F4ED");
  expect(themeCss).toContain("--pc-freshness-green: #1F6B49");
  expect(themeCss).toContain("--pc-price-positive: var(--pc-freshness-green)");
  expect(themeCss).toContain('"Instrument Sans Variable"');
  expect(themeCss).toContain('"IBM Plex Mono"');
  expect(productLedgerSource).toContain("color: tokens.textSecondary");
  expect(productLedgerSource).toContain("backgroundColor: tokens.freshnessSoft");
  expect(productLedgerSource).toContain("color: tokens.freshnessGreen");
});

test("skip navigation moves keyboard focus into the main working region", () => {
  render(
    <AppShell navigation={<span>Navigation</span>}>
      <button type="button">Start comparing</button>
    </AppShell>,
  );

  const skipLink = screen.getByRole("link", { name: "Skip to main content" });
  const main = screen.getByRole("main");

  skipLink.focus();
  expect(skipLink).toHaveFocus();
  fireEvent.click(skipLink);
  expect(main).toHaveFocus();
});

test("representative controls receive the production visible-focus and 44px touch-target contracts", async () => {
  const style = installProductionTheme();
  const user = userEvent.setup();
  render(
    <>
      <Button>Open comparison</Button>
      <TextField aria-label="Search products" />
    </>,
  );

  const button = screen.getByRole("button", { name: "Open comparison" });
  const search = screen.getByRole("textbox", { name: "Search products" });

  await user.tab();
  expect(button).toHaveFocus();
  expectVisibleFocusRule(style, button);

  await user.tab();
  expect(search).toHaveFocus();
  expectVisibleFocusRule(style, search);

  expect(button).toHaveStyle({ minHeight: "44px" });
  const searchTouchTarget = search.closest(".rt-TextFieldRoot");
  expect(searchTouchTarget).not.toBeNull();
  expect(searchTouchTarget).toHaveStyle({ minHeight: "44px" });

  style.remove();
});

test("comparison continuity presents normalized selections as numbered labels and a canonical action", () => {
  render(
    <MemoryRouter>
      <ComparisonContinuity
        destination="/compare?slug=alpha&slug=beta"
        products={[
          { label: "Alpha Camera", slug: "alpha" },
          { label: "Beta Camera", slug: "beta" },
        ]}
      />
    </MemoryRouter>,
  );

  const continuity = screen.getByRole("region", { name: "Comparison selection" });
  expect(within(continuity).getByRole("list")).toBeInTheDocument();
  expect(within(continuity).getByText("1. Alpha Camera")).toBeInTheDocument();
  expect(within(continuity).getByText("2. Beta Camera")).toBeInTheDocument();
  expect(within(continuity).getByRole("link", { name: "Open comparison" })).toHaveAttribute(
    "href",
    "/compare?slug=alpha&slug=beta",
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
          title: "Alpha Camera",
        },
      ]}
      secondaryDisclosureLabel="More details"
    />,
  );

  const ledger = screen.getByRole("list", { name: "Products" });
  const mobileDisclosure = within(ledger).getByRole("button", {
    hidden: true,
    name: "More details",
  });
  expect(within(ledger).getAllByRole("article")).toHaveLength(1);
  expect(within(ledger).getByRole("heading", { name: "Alpha Camera" })).toBeInTheDocument();
  expect(mobileDisclosure).toHaveAttribute("aria-expanded", "false");
  expect(within(ledger).getByRole("link", { name: "View Alpha Camera" })).toBeInTheDocument();
  expect(within(ledger).getByText("Cameras")).toHaveAttribute("data-tone", "secondary");
  expect(within(ledger).getByText("Price signal")).toHaveAttribute("data-tone", "secondary");
  expect(within(ledger).getByText("Last checked today")).toHaveAttribute("data-tone", "freshness");
  expect(within(ledger).getByText("24 MP · Weather sealed").closest("[data-slot]")).toHaveAttribute(
    "data-slot",
    "product-ledger-highlights",
  );
  expect(within(ledger).getByText("$849 at Example Store").closest("[data-slot]")).toHaveAttribute(
    "data-slot",
    "product-ledger-offer",
  );
  expect(within(ledger).getByText("Lowest in 30 days").closest("[data-slot]")).toHaveAttribute(
    "data-slot",
    "product-ledger-price-signal",
  );
  expect(within(ledger).getByText("Last checked today")).toHaveAttribute(
    "data-slot",
    "product-ledger-freshness",
  );
  expect(mobileDisclosure).toHaveAttribute("data-slot", "button");
  expect(mobileDisclosure).toHaveAttribute("data-variant", "soft");
  expect(mobileDisclosure).toHaveStyle({
    minHeight: "44px",
  });
});

test("compare mark preserves the product identity without ornamental imagery", () => {
  render(<CompareMark label="Product Compare" />);

  expect(screen.getByLabelText("Product Compare")).toHaveTextContent("Product Compare");
});

test("responsive navigation keeps search and comparison direct while grouping guest, member, and operator destinations", () => {
  const { rerender } = render(
    <MemoryRouter>
      <RootPrimaryNavigation viewer={null} />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "Search products" })).toHaveAttribute(
    "href",
    "/products",
  );
  expect(screen.getByRole("link", { name: "Compare products" })).toHaveAttribute(
    "href",
    "/compare",
  );
  expect(screen.getByRole("button", { name: "Guest menu" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Offers" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Explore menu" }));
  const exploreNavigation = screen.getByRole("navigation", { name: "Explore navigation" });
  expect(within(exploreNavigation).getByRole("link", { name: "Offers" })).toHaveAttribute(
    "href",
    "/offers",
  );
  expect(within(exploreNavigation).getByRole("link", { name: "Merchants" })).toHaveAttribute(
    "href",
    "/merchants",
  );

  rerender(
    <MemoryRouter>
      <RootPrimaryNavigation
        viewer={{ email: "member@example.com", id: "member-1", isOperator: false }}
      />
    </MemoryRouter>,
  );
  expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Operator menu" })).not.toBeInTheDocument();

  rerender(
    <MemoryRouter>
      <RootPrimaryNavigation
        viewer={{ email: "operator@example.com", id: "operator-1", isOperator: true }}
      />
    </MemoryRouter>,
  );
  expect(screen.getByRole("button", { name: "Operator menu" })).toBeInTheDocument();
});
