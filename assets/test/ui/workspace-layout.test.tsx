import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ActiveFilterChips } from "../../src/ui/components/filters/ActiveFilterChips";
import { FilterBar } from "../../src/ui/components/filters/FilterBar";
import { SummaryStrip } from "../../src/ui/components/data/SummaryStrip";
import { RecordTable } from "../../src/ui/components/data/RecordTable";
import { DisclosureGroup } from "../../src/ui/components/feedback/DisclosureGroup";
import { ContextRail } from "../../src/ui/components/layout/ContextRail";
import { DetailTabs } from "../../src/ui/components/layout/DetailTabs";
import { MobileContextPanel } from "../../src/ui/components/layout/MobileContextPanel";
import { WorkspaceLayout } from "../../src/ui/components/layout/WorkspaceLayout";
import { ActionDialog } from "../../src/ui/components/overlays/ActionDialog";

test("WorkspaceLayout separates the primary task from supporting context", () => {
  render(
    <WorkspaceLayout
      context={
        <ContextRail label="Catalog controls">
          <button type="button">Apply filters</button>
        </ContextRail>
      }
      label="Product results"
    >
      <h2>12 products</h2>
    </WorkspaceLayout>
  );

  const workspace = screen.getByRole("region", { name: "Product results" });
  const context = screen.getByRole("complementary", { name: "Catalog controls" });

  expect(within(workspace).getByRole("heading", { name: "12 products" })).toBeInTheDocument();
  expect(within(context).getByRole("button", { name: "Apply filters" })).toBeInTheDocument();
});

test("MobileContextPanel exposes supporting controls through Radix disclosure", () => {
  render(
    <MobileContextPanel label="Filters" summary="3 active">
      <label>
        Search
        <input type="search" />
      </label>
    </MobileContextPanel>
  );

  const trigger = screen.getByRole("button", { name: /filters/i });

  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByLabelText("Search")).not.toBeInTheDocument();

  fireEvent.click(trigger);

  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByLabelText("Search")).toBeInTheDocument();
});

test("DetailTabs switches between peer views with Radix tab semantics", () => {
  render(
    <DetailTabs
      defaultValue="overview"
      label="Product details"
      items={[
        { content: <p>Decision highlights</p>, label: "Overview", value: "overview" },
        { content: <p>Technical attributes</p>, label: "Specifications", value: "specs" }
      ]}
    />
  );

  const tablist = screen.getByRole("tablist", { name: "Product details" });
  const specifications = within(tablist).getByRole("tab", { name: "Specifications" });

  expect(screen.getByRole("tabpanel")).toHaveTextContent("Decision highlights");

  fireEvent.mouseDown(specifications, { button: 0, ctrlKey: false });

  expect(specifications).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Technical attributes");
});

test("DisclosureGroup progressively reveals supporting detail", () => {
  render(
    <DisclosureGroup
      items={[
        { content: <p>24 megapixels</p>, label: "Imaging", value: "imaging" },
        { content: <p>520 grams</p>, label: "Body", value: "body" }
      ]}
      label="Specification groups"
    />
  );

  const imaging = screen.getByRole("button", { name: "Imaging" });

  expect(screen.queryByText("24 megapixels")).not.toBeInTheDocument();
  fireEvent.click(imaging);
  expect(screen.getByText("24 megapixels")).toBeInTheDocument();
});

test("SummaryStrip preserves metric label and value relationships", () => {
  render(
    <SummaryStrip
      items={[
        { label: "Visible offers", value: "8" },
        { label: "Lowest price", value: "$849" }
      ]}
      label="Offer snapshot"
    />
  );

  const summary = screen.getByRole("region", { name: "Offer snapshot" });
  const terms = within(summary).getAllByRole("term");
  const definitions = within(summary).getAllByRole("definition");

  expect(terms.map((term) => term.textContent)).toEqual(["Visible offers", "Lowest price"]);
  expect(definitions.map((definition) => definition.textContent)).toEqual(["8", "$849"]);
});

test("RecordTable retains row and column relationships", () => {
  render(
    <RecordTable
      columns={[
        { key: "merchant", label: "Merchant" },
        { key: "status", label: "Status" }
      ]}
      label="Merchant programs"
      rows={[
        { cells: { merchant: "Northwind", status: "Active" }, key: "northwind" }
      ]}
    />
  );

  const tableRegion = screen.getByRole("region", { name: "Merchant programs" });
  const table = within(tableRegion).getByRole("table");

  expect(within(table).getByRole("columnheader", { name: "Merchant" })).toBeInTheDocument();
  expect(within(table).getByRole("cell", { name: "Northwind" })).toBeInTheDocument();
  expect(within(table).getByRole("cell", { name: "Active" })).toBeInTheDocument();
});

test("FilterBar keeps active filter removal beside essential controls", () => {
  render(
    <FilterBar label="Product controls">
      <input aria-label="Search products" type="search" />
      <ActiveFilterChips
        items={[
          {
            key: "brand",
            label: "Brand: Acme",
            removeControl: <button type="button">Remove Brand: Acme</button>
          }
        ]}
      />
    </FilterBar>
  );

  const controls = screen.getByRole("region", { name: "Product controls" });

  expect(within(controls).getByRole("searchbox", { name: "Search products" })).toBeInTheDocument();
  expect(within(controls).getByRole("button", { name: "Remove Brand: Acme" })).toBeInTheDocument();
});

test("ActionDialog labels focused creation content and restores trigger focus", async () => {
  render(
    <ActionDialog
      description="Choose a label and expiration."
      title="Create API token"
      trigger={<button type="button">New token</button>}
    >
      <label>
        Token label
        <input />
      </label>
    </ActionDialog>
  );

  const trigger = screen.getByRole("button", { name: "New token" });
  fireEvent.click(trigger);

  const dialog = screen.getByRole("dialog", { name: "Create API token" });
  expect(within(dialog).getByText("Choose a label and expiration.")).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

  await waitFor(() => expect(trigger).toHaveFocus());
});
