import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DataList, DataListItem } from "../../src/ui/components/data/data-list";
import { FeedbackState } from "../../src/ui/components/feedback/feedback-state";
import { PageShell } from "../../src/ui/components/layout/page-shell";
import { SectionHeading } from "../../src/ui/components/layout/section-heading";
import { Pagination } from "../../src/ui/components/navigation/pagination";
import { StatusBadge } from "../../src/ui/components/status/status-badge";

test("PageShell connects its title and keeps actions in the header", () => {
  render(
    <PageShell
      actions={<button type="button">Filter</button>}
      description="Review current merchant offers"
      title="Offers"
    >
      <p>Rows</p>
    </PageShell>
  );

  const region = screen.getByRole("region", { name: "Offers" });

  expect(within(region).getByText("Review current merchant offers")).toBeInTheDocument();
  expect(within(region).getByRole("button", { name: "Filter" })).toBeInTheDocument();
  expect(within(region).getByText("Rows")).toBeInTheDocument();
});

test("FeedbackState preserves status and alert semantics", () => {
  const { rerender } = render(<FeedbackState kind="loading" title="Loading offers" />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading offers");

  rerender(<FeedbackState kind="error" title="Offers unavailable" />);

  expect(screen.getByRole("alert")).toHaveTextContent("Offers unavailable");
});

test("Pagination exposes one navigation landmark", () => {
  render(
    <MemoryRouter>
      <Pagination
        firstHref="/offers"
        label="Offer pages"
        nextHref="/offers?after=next"
      />
    </MemoryRouter>
  );

  const navigation = screen.getByRole("navigation", { name: "Offer pages" });

  expect(within(navigation).getByRole("link", { name: "First page" })).toHaveAttribute(
    "href",
    "/offers"
  );
  expect(within(navigation).getByRole("link", { name: "Next page" })).toHaveAttribute(
    "href",
    "/offers?after=next"
  );
});

test("DataList preserves list semantics for dense rows", () => {
  render(
    <DataList label="Products">
      <DataListItem actions={<button type="button">Compare</button>}>
        <span>Camera</span>
      </DataListItem>
    </DataList>
  );

  const list = screen.getByRole("list", { name: "Products" });

  const item = within(list).getByRole("listitem");

  expect(item).toHaveTextContent("Camera");
  expect(item).toHaveAttribute("data-slot", "data-list-item");
  expect(within(item).getByRole("button", { name: "Compare" }).parentElement).toHaveAttribute(
    "data-slot",
    "data-list-actions"
  );
});

test("StatusBadge renders its status text through Radix Badge", () => {
  render(<StatusBadge tone="positive">Active</StatusBadge>);

  expect(screen.getByText("Active")).toHaveClass("rt-Badge");
});

test("SectionHeading groups a title with orientation copy", () => {
  render(
    <SectionHeading description="Prices on the visible page" title="Offer snapshot" />
  );

  expect(screen.getByRole("heading", { name: "Offer snapshot" })).toBeInTheDocument();
  expect(screen.getByText("Prices on the visible page")).toBeInTheDocument();
});
