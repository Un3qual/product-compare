import { render, screen } from "@testing-library/react";
import { Button, Label, Separator } from "../../src/ui/primitives/index";
import { TextField } from "../../src/ui/primitives/text-field";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../../src/ui/primitives/collapsible";

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

  expect(link).toHaveAttribute("data-slot", "button");
  expect(link).toHaveAttribute("href", "/products");
  expect(
    screen.queryByRole("button", { name: "Browse products" })
  ).not.toBeInTheDocument();
});

test("Button defaults to a native button while using Radix Themes", () => {
  render(<Button>Apply</Button>);

  const button = screen.getByRole("button", { name: "Apply" });

  expect(button).toHaveAttribute("type", "button");
  expect(button).toHaveAttribute("data-slot", "button");
  expect(button).toHaveClass("rt-BaseButton");
});

test("TextField renders a named Radix input", () => {
  render(<TextField aria-label="Search products" name="q" type="search" />);

  const input = screen.getByRole("searchbox", { name: "Search products" });

  expect(input).toHaveAttribute("name", "q");
  expect(input).toHaveAttribute("data-slot", "text-field");
  expect(input).toHaveClass("rt-TextFieldInput");
});

test("Separator renders the expected accessibility role and orientation", () => {
  render(<Separator aria-label="Section divider" orientation="vertical" />);

  const separator = screen.getByRole("separator", { name: "Section divider" });

  expect(separator).toHaveAttribute("data-slot", "separator");
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
  expect(trigger).toHaveAttribute("data-slot", "collapsible-trigger");
});
