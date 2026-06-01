import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RootLayout, RootRoute } from "../root";

test("root layout renders primitive-backed links in the primary navigation", () => {
  render(
    <MemoryRouter>
      <RootLayout />
    </MemoryRouter>
  );

  const primaryNavigation = screen.getByRole("navigation", { name: "Primary" });

  expect(primaryNavigation).toBeInTheDocument();
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
  expect(screen.getByRole("link", { name: "API tokens" })).toHaveAttribute(
    "href",
    "/account/api-tokens"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Revenue" })).toHaveAttribute(
    "href",
    "/commerce/revenue"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Merchants" })).toHaveAttribute(
    "href",
    "/merchants"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Affiliate setup" })).toHaveAttribute(
    "href",
    "/affiliate/setup"
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
  expect(screen.getByRole("link", { name: "API tokens" })).toHaveAttribute(
    "href",
    "/account/api-tokens"
  );
  const homeActions = screen.getByRole("group", { name: "Home actions" });

  expect(within(homeActions).getByRole("link", { name: "Revenue" })).toHaveAttribute(
    "href",
    "/commerce/revenue"
  );
  expect(within(homeActions).getByRole("link", { name: "Merchants" })).toHaveAttribute(
    "href",
    "/merchants"
  );
  expect(within(homeActions).getByRole("link", { name: "Affiliate setup" })).toHaveAttribute(
    "href",
    "/affiliate/setup"
  );
  expect(screen.queryByRole("button", { name: "Browse products" })).not.toBeInTheDocument();
});
