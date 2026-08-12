import { productOffersPath } from "../../../src/routes/offers/paths";

test.each([
  ["product-1", "/offers?productId=product-1"],
  ["product / one?", "/offers?productId=product%20%2F%20one%3F"],
  ["  ", "/offers?productId=%20%20"],
  ["", "/offers?productId="],
])("builds the product-scoped offer path for %j", (productId, expectedPath) => {
  expect(productOffersPath(productId)).toBe(expectedPath);
});

test("preserves at most three normalized comparison slugs in product offer paths", () => {
  expect(productOffersPath("product-1", [" alpha ", "beta", "alpha", "", "gamma", "fourth"])).toBe(
    "/offers?productId=product-1&slug=alpha&slug=beta&slug=gamma",
  );
});
