import { render, screen } from "@testing-library/react";
import { Button, Label, Separator } from "../primitives";

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

test("Separator renders the expected accessibility role and orientation", () => {
  render(<Separator aria-label="Section divider" orientation="vertical" />);

  const separator = screen.getByRole("separator", { name: "Section divider" });

  expect(separator).toHaveAttribute("data-slot", "separator");
  expect(separator).toHaveAttribute("aria-orientation", "vertical");
});
