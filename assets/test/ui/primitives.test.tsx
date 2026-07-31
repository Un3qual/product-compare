import { render, screen } from "@testing-library/react";
import {
  Button,
  Checkbox,
  Label,
  Select,
  Separator,
  TextArea,
} from "../../src/ui/primitives/index";
import { TextField } from "../../src/ui/primitives/TextField";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../src/ui/primitives/Collapsible";
import { AppProviders } from "../../src/ui/providers/AppProviders";
import { chooseSelectOption, openSelect } from "../helpers/radix-select";

test("Label associates auth fields with their inputs", () => {
  render(
    <div>
      <Label htmlFor="email">Email</Label>
      <input id="email" name="email" type="email" />
    </div>,
  );

  expect(screen.getByLabelText("Email")).toHaveAttribute("id", "email");
});

test("Button preserves link semantics when composed through the slot wrapper", () => {
  render(
    <Button asChild>
      <a href="/products">Browse products</a>
    </Button>,
  );

  const link = screen.getByRole("link", { name: "Browse products" });

  expect(link).toHaveAttribute("href", "/products");
  expect(screen.queryByRole("button", { name: "Browse products" })).not.toBeInTheDocument();
});

test("Button defaults to native button semantics", () => {
  render(<Button>Apply</Button>);

  const button = screen.getByRole("button", { name: "Apply" });

  expect(button).toHaveAttribute("type", "button");
});

test("Button exposes destructive intent through its semantic tone", () => {
  render(<Button tone="danger">Delete</Button>);

  const button = screen.getByRole("button", { name: "Delete" });

  expect(button).toHaveAttribute("data-tone", "danger");
  expect(button).not.toHaveAttribute("color");
});

test("TextField renders a named search input", () => {
  render(<TextField aria-label="Search products" name="q" type="search" />);

  const input = screen.getByRole("searchbox", { name: "Search products" });

  expect(input).toHaveAttribute("name", "q");
});

test("form wrappers preserve names, values, and browser-native input types", () => {
  render(
    <AppProviders>
      <form aria-label="Control contract">
        <TextField
          aria-label="Expires at"
          defaultValue="2026-08-01T09:30"
          name="expiresAt"
          type="datetime-local"
        />
        <Select
          aria-label="Sort"
          defaultValue="price_asc"
          name="sort"
          options={[
            { label: "Price", value: "price_asc" },
            { label: "Name", value: "name_asc" },
          ]}
        />
        <TextArea aria-label="Notes" defaultValue="Keep this" name="notes" />
        <Checkbox aria-label="Searchable" defaultChecked name="searchable" />
      </form>
    </AppProviders>,
  );

  const form = screen.getByRole("form", {
    name: "Control contract",
  }) as HTMLFormElement;
  const formData = new FormData(form);

  expect(screen.getByLabelText("Expires at")).toHaveAttribute("type", "datetime-local");
  expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent("Price");
  expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue("Keep this");
  expect(screen.getByRole("checkbox", { name: "Searchable" })).toBeChecked();
  expect(Object.fromEntries(formData)).toMatchObject({
    expiresAt: "2026-08-01T09:30",
    notes: "Keep this",
    searchable: "on",
    sort: "price_asc",
  });
});

test("Select exposes its value and updates its form value through accessible options", () => {
  render(
    <AppProviders>
      <form aria-label="Select contract">
        <Select
          aria-label="Sort"
          defaultValue="price_asc"
          name="sort"
          options={[
            { label: "Price", value: "price_asc" },
            { label: "Name", value: "name_asc" },
          ]}
        />
      </form>
    </AppProviders>,
  );

  const select = screen.getByRole("combobox", { name: "Sort" });

  expect(select).toHaveValue("price_asc");
  chooseSelectOption(select, "Name");

  const form = screen.getByRole("form", { name: "Select contract" }) as HTMLFormElement;
  expect(select).toHaveValue("name_asc");
  expect(new FormData(form).get("sort")).toBe("name_asc");
});

test("controlled Select follows option and value updates without emitting a change", () => {
  const onValueChange = vi.fn();
  const { rerender } = render(
    <form>
      <Select
        aria-label="Catalog sort"
        onValueChange={onValueChange}
        options={[{ label: "Catalog order", value: "ID_ASC" }]}
        value="ID_ASC"
      />
    </form>,
  );

  rerender(
    <form>
      <Select
        aria-label="Catalog sort"
        onValueChange={onValueChange}
        options={[
          { label: "Relevance", value: "RELEVANCE" },
          { label: "Catalog order", value: "ID_ASC" },
        ]}
        value="RELEVANCE"
      />
    </form>,
  );

  const select = screen.getByRole("combobox", { name: "Catalog sort" });
  expect(select).toHaveTextContent("Relevance");
  openSelect(select);
  expect(select).toHaveTextContent("Relevance");
  expect(onValueChange).not.toHaveBeenCalled();
});

test("Separator renders the expected accessibility role and orientation", () => {
  render(<Separator aria-label="Section divider" orientation="vertical" />);

  const separator = screen.getByRole("separator", { name: "Section divider" });

  expect(separator).toHaveAttribute("aria-orientation", "vertical");
});

test("Collapsible exposes Radix state and accessibility semantics", () => {
  render(
    <Collapsible>
      <CollapsibleTrigger>Advanced filters</CollapsibleTrigger>
      <CollapsibleContent>Filter fields</CollapsibleContent>
    </Collapsible>,
  );

  const trigger = screen.getByRole("button", { name: "Advanced filters" });

  expect(trigger).toHaveAttribute("aria-expanded", "false");
});
