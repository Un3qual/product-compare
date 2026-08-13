import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpecificationFilterDrawer } from "../../../../src/routes/products/specifications/SpecificationFilterDrawer";
import type { SpecFilterSelection } from "../../../../src/routes/products/specifications/spec-filter-selection";

const selections: SpecFilterSelection[] = [
  {
    attributeId: "attribute-panel",
    code: "panel-technology",
    displayName: "Panel technology",
    kind: "enum",
    mode: "same",
    value: "enum-oled",
  },
  {
    attributeId: "attribute-refresh",
    code: "refresh-rate",
    displayName: "Refresh rate",
    kind: "numeric",
    mode: "same",
    unitSymbol: "Hz",
    value: "120",
  },
];

test("edits multiple selected specs in one bottom drawer", async () => {
  const user = userEvent.setup();
  const onSelectionsChange = vi.fn();

  render(
    <SpecificationFilterDrawer
      matchingHref="/products?enum.attribute-panel=enum-oled&numeric.attribute-refresh.min=120"
      onOpenChange={vi.fn()}
      onSelectionsChange={onSelectionsChange}
      open
      selections={selections}
    />,
  );

  const drawer = screen.getByRole("dialog", { name: "Filter by selected specs" });

  expect(drawer).toHaveAttribute("data-placement", "bottom");
  expect(screen.getByText("2 specs selected")).toBeVisible();
  expect(screen.getByText("Panel technology")).toBeVisible();
  expect(screen.getByText("Refresh rate")).toBeVisible();
  expect(screen.getByRole("link", { name: "Show matching products" })).toHaveAttribute(
    "href",
    "/products?enum.attribute-panel=enum-oled&numeric.attribute-refresh.min=120",
  );

  await user.click(screen.getByRole("radio", { name: "At least" }));

  expect(onSelectionsChange).toHaveBeenLastCalledWith([
    selections[0],
    { ...selections[1], mode: "at_least" },
  ]);
});

test("clears every pending spec without navigating", async () => {
  const user = userEvent.setup();
  const onSelectionsChange = vi.fn();

  render(
    <SpecificationFilterDrawer
      matchingHref="/products"
      onOpenChange={vi.fn()}
      onSelectionsChange={onSelectionsChange}
      open
      selections={selections}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Clear selected specs" }));

  expect(onSelectionsChange).toHaveBeenLastCalledWith([]);
});
