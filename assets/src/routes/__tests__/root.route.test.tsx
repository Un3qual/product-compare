import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RootLayout, RootRoute } from "../root";

test("root layout renders primitive-backed links in the primary navigation", () => {
  render(
    <MemoryRouter>
      <RootLayout />
    </MemoryRouter>
  );

  expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Product Compare" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("link", { name: "Compare products" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("link", { name: "Saved comparisons" })).toHaveAttribute(
    "data-slot",
    "button"
  );
});

test("root route keeps home actions as links while using the shared button wrapper", () => {
  render(
    <MemoryRouter>
      <RootRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Product Compare" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("link", { name: "Compare products" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.getByRole("link", { name: "Saved comparisons" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(screen.queryByRole("button", { name: "Browse products" })).not.toBeInTheDocument();
});
