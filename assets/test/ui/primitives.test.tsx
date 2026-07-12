import { render, screen } from "@testing-library/react";
import { Button, Label, Separator } from "../../src/ui/primitives/index";
import { TextField } from "../../src/ui/primitives/TextField";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../../src/ui/primitives/Collapsible";

test("Label associates auth fields with their inputs", () => {
  render(
    <div>
      <Label htmlFor="email">Email</Label>
      <input id="email" name="email" type="email" />
    </div>
  );

  expect(screen.getByLabelText("Email")).toHaveAttribute("id", "email");
});

test("Button preserves link semantics when composed through the slot wrapper", () => {
  render(
    <Button asChild>
      <a href="/products">Browse products</a>
    </Button>
  );

  const link = screen.getByRole("link", { name: "Browse products" });

  expect(link).toHaveAttribute("href", "/products");
  expect(
    screen.queryByRole("button", { name: "Browse products" })
  ).not.toBeInTheDocument();
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
    </Collapsible>
  );

  const trigger = screen.getByRole("button", { name: "Advanced filters" });

  expect(trigger).toHaveAttribute("aria-expanded", "false");
});
