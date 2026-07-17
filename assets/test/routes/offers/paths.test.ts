import { productOffersPath } from "../../../src/routes/offers/paths";

test.each([
  ["product-1", "/offers?productId=product-1"],
  ["product / one?", "/offers?productId=product%20%2F%20one%3F"],
  ["  ", "/offers?productId=%20%20"],
  ["", "/offers?productId="]
])("builds the product-scoped offer path for %j", (productId, expectedPath) => {
  expect(productOffersPath(productId)).toBe(expectedPath);
});
