import { expectTypeOf, test } from "vitest";
import type { ProductDetailRouteQuery } from "$generated/ProductDetailRouteQuery.graphql";

type Product = NonNullable<ProductDetailRouteQuery["response"]["product"]>;

test("generated response fields use GraphQL nullability without optional widening", () => {
  expectTypeOf<Product["description"]>().toEqualTypeOf<string | null>();
});

test("generated optional variables remain omittable", () => {
  expectTypeOf<ProductDetailRouteQuery["variables"]["offersAfter"]>().toEqualTypeOf<
    string | null | undefined
  >();
});
