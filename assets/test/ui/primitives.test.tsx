import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  Button,
  Checkbox,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "../../src/ui/primitives/index";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../src/ui/primitives/Collapsible";
import { AppProviders } from "../../src/ui/providers/AppProviders";
import { chooseSelectOption, openSelect } from "../helpers/base-select";

test("Label associates auth fields with their inputs", () => {
  render(
    <div>
      <Label htmlFor="email">Email</Label>
      <input id="email" name="email" type="email" />
    </div>,
  );

  expect(screen.getByLabelText("Email")).toHaveAttribute("id", "email");
});

test("Button preserves link semantics through the Base UI render API", () => {
  render(<Button render={<a href="/products" />}>Browse products</Button>);

  const link = screen.getByRole("link", { name: "Browse products" });

  expect(link).toHaveAttribute("href", "/products");
  expect(screen.queryByRole("button", { name: "Browse products" })).not.toBeInTheDocument();
});

test("Button defaults to native button semantics", () => {
  render(<Button>Apply</Button>);

  const button = screen.getByRole("button", { name: "Apply" });

  expect(button).toHaveAttribute("type", "button");
});

test("Button keeps type=button safety when rendering a native button", () => {
  const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());

  render(
    <form onSubmit={onSubmit}>
      <Button render={<button />}>Preview</Button>
    </form>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Preview" }));

  expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute("type", "button");
  expect(onSubmit).not.toHaveBeenCalled();
});

test("Button preserves explicit submit semantics", () => {
  render(<Button type="submit">Save</Button>);

  expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
});

test("Button exposes the shadcn destructive variant", () => {
  render(<Button variant="destructive">Delete</Button>);

  const button = screen.getByRole("button", { name: "Delete" });

  expect(button).toHaveAttribute("data-variant", "destructive");
  expect(button).not.toHaveAttribute("color");
});

test("Input renders a named search input", () => {
  render(<Input aria-label="Search products" name="q" type="search" />);

  const input = screen.getByRole("searchbox", { name: "Search products" });

  expect(input).toHaveAttribute("name", "q");
});

test("form wrappers preserve names, values, and browser-native input types", () => {
  render(
    <AppProviders>
      <form aria-label="Control contract">
        <Input
          aria-label="Expires at"
          defaultValue="2026-08-01T09:30"
          name="expiresAt"
          type="datetime-local"
        />
        <ExampleSelect
          aria-label="Sort"
          defaultValue="price_asc"
          name="sort"
          options={[
            { label: "Price", value: "price_asc" },
            { label: "Name", value: "name_asc" },
          ]}
        />
        <Textarea aria-label="Notes" defaultValue="Keep this" name="notes" />
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
  expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("price_asc");
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
        <ExampleSelect
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

  expect(select).toHaveTextContent("Price");
  chooseSelectOption(select, "Name");

  const form = screen.getByRole("form", { name: "Select contract" }) as HTMLFormElement;
  expect(select).toHaveTextContent("Name");
  expect(new FormData(form).get("sort")).toBe("name_asc");
});

test("uncontrolled Select restores its default label and form value on native form reset", () => {
  render(
    <AppProviders>
      <form aria-label="Resettable select">
        <ExampleSelect
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

  const form = screen.getByRole("form", { name: "Resettable select" }) as HTMLFormElement;
  const select = screen.getByRole("combobox", { name: "Sort" });

  chooseSelectOption(select, "Name");
  expect(select).toHaveTextContent("Name");
  expect(new FormData(form).get("sort")).toBe("name_asc");

  act(() => form.reset());

  expect(select).toHaveTextContent("Price");
  expect(new FormData(form).get("sort")).toBe("price_asc");
});

test("checkbox and radio controls use the shared interaction-target height", () => {
  render(
    <AppProviders>
      <Checkbox aria-label="Searchable" />
      <RadioGroup defaultValue="all">
        <RadioGroupItem aria-label="All products" value="all" />
      </RadioGroup>
    </AppProviders>,
  );

  expect(getComputedStyle(screen.getByRole("checkbox", { name: "Searchable" })).height).toMatch(
    /^var\(--/,
  );
  expect(getComputedStyle(screen.getByRole("radio", { name: "All products" })).height).toMatch(
    /^var\(--/,
  );
});

test("Select gives keyboard-moved options a visible highlighted background", async () => {
  render(
    <AppProviders>
      <ExampleSelect
        aria-label="Rating"
        defaultValue="5"
        options={[
          { label: "Five", value: "5" },
          { label: "Four", value: "4" },
        ]}
      />
    </AppProviders>,
  );

  const select = screen.getByRole("combobox", { name: "Rating" });

  openSelect(select);

  const selectedOption = screen.getByRole("option", { name: "Five" });
  act(() => selectedOption.focus());
  fireEvent.keyDown(selectedOption, { key: "ArrowDown" });

  const highlightedOption = screen.getByRole("option", { name: "Four" });
  await waitFor(() => expect(highlightedOption).toHaveAttribute("data-highlighted"));
  const backgroundColor = getComputedStyle(highlightedOption).backgroundColor;
  expect(backgroundColor).not.toBe("transparent");
  expect(backgroundColor).not.toMatch(/^rgba?\(0,\s*0,\s*0,\s*0\)$/);
});

test("controlled Select follows option and value updates without emitting a change", () => {
  const onValueChange = vi.fn();
  const { rerender } = render(
    <form>
      <ExampleSelect
        aria-label="Catalog sort"
        onValueChange={onValueChange}
        options={[{ label: "Catalog order", value: "ID_ASC" }]}
        value="ID_ASC"
      />
    </form>,
  );

  rerender(
    <form>
      <ExampleSelect
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

test("Collapsible exposes Base UI state and accessibility semantics", () => {
  render(
    <Collapsible>
      <CollapsibleTrigger>Advanced filters</CollapsibleTrigger>
      <CollapsibleContent>Filter fields</CollapsibleContent>
    </Collapsible>,
  );

  const trigger = screen.getByRole("button", { name: "Advanced filters" });

  expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("Tabs register a stable Base UI composite list", () => {
  render(
    <MemoryRouter>
      <Tabs defaultValue="one">
        <TabsList aria-label="Views">
          <TabsTrigger nativeButton={false} render={<a href="?view=one" />} value="one">
            One
          </TabsTrigger>
          <TabsTrigger nativeButton={false} render={<a href="?view=two" />} value="two">
            Two
          </TabsTrigger>
        </TabsList>
        <TabsContent value="one">First view</TabsContent>
        <TabsContent value="two">Second view</TabsContent>
      </Tabs>
    </MemoryRouter>,
  );

  expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");
});

function ExampleSelect({
  "aria-label": ariaLabel,
  options,
  placeholder,
  ...selectProps
}: {
  "aria-label": string;
  defaultValue?: string;
  name?: string;
  onValueChange?: (value: string | null) => void;
  options: readonly { label: string; value: string }[];
  placeholder?: string;
  value?: string;
}) {
  return (
    <Select items={options} {...selectProps}>
      <SelectTrigger aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
