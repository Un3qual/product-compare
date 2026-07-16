import {
  getCategoryViewData,
  type CategoryViewDataInput
} from "../../../src/routes/categories/category-view-data";

test("derives the exact category copy and encoded catalog browse path", () => {
  const data = getCategoryViewData(
    buildCategory({ id: "taxon / cameras?", name: "Cameras & Lenses", qualifiedProductCount: 12 })
  );

  expect(data.title).toBe("Compare Cameras & Lenses");
  expect(data.qualificationCopy).toBe(
    "12 products currently meet this category’s specification, content, and offer-quality threshold."
  );
  expect(data.browsePath).toBe(
    "/products?typeTaxonId=taxon%20%2F%20cameras%3F&includeTypeDescendants=1"
  );
});

test("returns an encoded next-page path only when a next page and cursor are both available", () => {
  expect(
    getCategoryViewData(
      buildCategory({
        slug: "cameras",
        products: buildProducts([], { hasNextPage: true, endCursor: "cursor + /?" })
      })
    ).nextPagePath
  ).toBe("/categories/cameras?after=cursor%20%2B%20%2F%3F");

  expect(
    getCategoryViewData(
      buildCategory({ products: buildProducts([], { hasNextPage: false, endCursor: "cursor" }) })
    ).nextPagePath
  ).toBeNull();
  expect(
    getCategoryViewData(
      buildCategory({ products: buildProducts([], { hasNextPage: true, endCursor: null }) })
    ).nextPagePath
  ).toBeNull();
});

test("uses an unknown-brand fallback only for nullish brand names", () => {
  const data = getCategoryViewData(
    buildCategory({
      products: buildProducts([
        buildProduct({ id: "empty", brand: { name: "" } }),
        buildProduct({ id: "null", brand: null }),
        buildProduct({ id: "undefined", brand: undefined })
      ])
    })
  );

  expect(data.productRows.map((product) => product.brandName)).toEqual([
    "",
    "Unknown brand",
    "Unknown brand"
  ]);
});

test("returns no product rows for an empty product connection", () => {
  expect(getCategoryViewData(buildCategory({ products: buildProducts([]) })).productRows).toEqual([]);
});

test("preserves source product order and keeps only the first three source-ordered highlights", () => {
  const first = buildProduct({
    id: "product-first",
    name: "First product",
    currentAttributes: [
      buildAttribute("fourth", "Fourth", "4"),
      buildAttribute("second", "Second", "2"),
      buildAttribute("fifth", "Fifth", "5"),
      buildAttribute("first", "First", "1"),
      buildAttribute("third", "Third", "3")
    ]
  });
  const second = buildProduct({ id: "product-second", name: "Second product" });

  const data = getCategoryViewData(buildCategory({ products: buildProducts([second, first]) }));

  expect(data.productRows.map((product) => product.name)).toEqual(["Second product", "First product"]);
  expect(data.productRows[1]?.specificationHighlights).toEqual(first.currentAttributes.slice(0, 3));
});

test("does not mutate the category, connection, products, or attributes it reads", () => {
  const category = buildCategory({
    products: buildProducts([
      buildProduct({ currentAttributes: [buildAttribute("resolution", "Resolution", "24 MP")] })
    ])
  });
  const original = structuredClone(category);

  getCategoryViewData(category);

  expect(category).toEqual(original);
});

function buildCategory(overrides: Partial<CategoryViewDataInput> = {}): CategoryViewDataInput {
  return {
    id: "taxon-1",
    name: "Cameras",
    slug: "cameras",
    qualifiedProductCount: 3,
    products: buildProducts([buildProduct()]),
    ...overrides
  };
}

function buildProducts(
  nodes: CategoryViewDataInput["products"]["edges"][number]["node"][],
  pageInfo: CategoryViewDataInput["products"]["pageInfo"] = {
    hasNextPage: false,
    endCursor: null
  }
): CategoryViewDataInput["products"] {
  return { edges: nodes.map((node) => ({ node })), pageInfo };
}

function buildProduct(
  overrides: Partial<CategoryViewDataInput["products"]["edges"][number]["node"]> = {}
): CategoryViewDataInput["products"]["edges"][number]["node"] {
  return {
    id: "product-1",
    name: "Field Camera",
    slug: "field-camera",
    brand: { name: "Acme" },
    currentAttributes: [buildAttribute("resolution", "Resolution", "24 MP")],
    ...overrides
  };
}

function buildAttribute(attributeId: string, displayName: string, valueText: string) {
  return { attributeId, displayName, valueText };
}
