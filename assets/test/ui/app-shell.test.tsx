import { render, screen } from "@testing-library/react";
import { AppShell } from "../../src/ui/components/layout/AppShell";

test("renders primary nav landmarks with a shared shell separator", () => {
  render(
    <AppShell navigation={<div>navigation</div>}>
      <div>content</div>
    </AppShell>,
  );

  expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  expect(screen.getByRole("separator")).toBeInTheDocument();
  expect(screen.getByRole("main")).toHaveTextContent("content");
});

test("lets keyboard users skip primary navigation", () => {
  render(
    <AppShell navigation={<div>navigation</div>}>
      <div>content</div>
    </AppShell>,
  );

  expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
    "href",
    "#main-content",
  );
  expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
});
