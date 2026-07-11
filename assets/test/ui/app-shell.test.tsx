import { render, screen } from "@testing-library/react";
import { AppShell } from "../../src/ui/components/layout/app-shell";

test("renders primary nav landmarks with a shared shell separator", () => {
  render(
    <AppShell navigation={<div>navigation</div>}>
      <div>content</div>
    </AppShell>
  );

  expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  expect(screen.getByRole("separator")).toHaveAttribute("data-slot", "separator");
  expect(screen.getByRole("main")).toHaveTextContent("content");
  expect(screen.getByRole("main").closest('[data-slot="app-shell"]')).toBeInTheDocument();
});
