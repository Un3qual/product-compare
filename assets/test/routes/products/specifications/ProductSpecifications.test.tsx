import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductSpecifications } from "../../../../src/routes/products/specifications/ProductSpecifications";

const attributes = [
  {
    attributeId: "attribute-panel",
    code: "panel-technology",
    dataType: "enum",
    displayName: "Panel technology",
    enumOptionId: "enum-oled",
    groupLabel: "Display",
    booleanValue: null,
    isRequired: false,
    numericValue: null,
    sortOrder: 1,
    unitSymbol: null,
    valueText: "OLED",
  },
  {
    attributeId: "attribute-refresh",
    code: "refresh-rate",
    dataType: "numeric",
    displayName: "Refresh rate",
    enumOptionId: null,
    groupLabel: "Display",
    booleanValue: null,
    isRequired: false,
    numericValue: "120",
    sortOrder: 2,
    unitSymbol: "Hz",
    valueText: "120 Hz",
  },
];

beforeEach(() => sessionStorage.clear());

test("builds a multi-spec catalog filter without leaving the specifications page", async () => {
  const user = userEvent.setup();

  render(
    <ProductSpecifications
      attributes={attributes}
      productId="product-tv"
      selectedCompareSlugs={["first-product", "second-product"]}
    />,
  );

  await user.click(screen.getByRole("checkbox", { name: /^Select Panel technology/ }));
  await user.click(screen.getByRole("button", { name: "Keep browsing specs" }));
  await user.click(screen.getByRole("checkbox", { name: /^Select Refresh rate/ }));

  expect(screen.getByText("2 specs selected")).toBeVisible();
  const catalogLink = screen.getByRole("link", { name: "Show matching products" });
  const catalogUrl = new URL(catalogLink.getAttribute("href") ?? "", "https://app.example.com");

  expect(catalogUrl.pathname).toBe("/products");
  expect(catalogUrl.searchParams.get("enum.attribute-panel")).toBe("enum-oled");
  expect(catalogUrl.searchParams.get("numeric.attribute-refresh.min")).toBe("120");
  expect(catalogUrl.searchParams.get("numeric.attribute-refresh.max")).toBe("120");
  expect(catalogUrl.searchParams.getAll("slug")).toEqual(["first-product", "second-product"]);

  await user.click(screen.getByRole("button", { name: "Keep browsing specs" }));
  expect(
    screen.queryByRole("dialog", { name: "Filter by selected specs" }),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Edit 2 selected specs" }));
  expect(screen.getByText("2 specs selected")).toBeVisible();
});

test("keeps selections in memory when session storage access is blocked", async () => {
  const user = userEvent.setup();
  const storage = vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
    throw new DOMException("Storage is unavailable", "SecurityError");
  });

  try {
    render(
      <ProductSpecifications
        attributes={attributes}
        productId="product-tv"
        selectedCompareSlugs={[]}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: /^Select Panel technology/ });
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByRole("button", { name: "Remove Panel technology" })).toBeInTheDocument();
  } finally {
    storage.mockRestore();
  }
});
