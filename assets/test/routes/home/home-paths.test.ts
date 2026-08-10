import {
  homeCatalogSearchPath,
  homeCategoryCatalogPath,
  homeProductDetailPath,
  selectedHomeCompareSlugs,
} from "../../../src/routes/home/home-paths";

test("home search trims a model query to the catalog limit and keeps the ordered comparison", () => {
  const query = `  ${"X".repeat(120)}  `;

  expect(homeCatalogSearchPath(query, [" alpha ", "beta", "alpha", "gamma", "delta"])).toBe(
    `/products?first=12&q=${"X".repeat(100)}&slug=alpha&slug=beta&slug=gamma`,
  );
});

test("home category entry uses the canonical catalog scope and preserves comparison continuity", () => {
  expect(homeCategoryCatalogPath("category/cameras", ["first model", "second/model"])).toBe(
    "/products?first=12&typeTaxonId=category%2Fcameras&includeTypeDescendants=1&slug=first+model&slug=second%2Fmodel",
  );
});

test("home model detail links and comparison selections use canonical normalized slugs", () => {
  expect(
    selectedHomeCompareSlugs("?slug=%20alpha%20&slug=beta&slug=alpha&slug=gamma&slug=delta"),
  ).toEqual(["alpha", "beta", "gamma"]);
  expect(homeProductDetailPath("model / one?", [" alpha ", "beta"])).toBe(
    "/products/model%20%2F%20one%3F?slug=alpha&slug=beta",
  );
});
