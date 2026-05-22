import { fetchQuery } from "relay-runtime";
import productDetailRouteQuery from "../../__generated__/ProductDetailRouteQuery.graphql";
import { fetchGraphQL } from "../fetch-graphql";
import { createRelayEnvironment, formatGraphQLErrorMessage, hasGraphQLErrors } from "../environment";
import { RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY } from "../load-query";

const { fetchGraphQLMock } = vi.hoisted(() => ({
  fetchGraphQLMock: vi.fn()
}));

vi.mock("../fetch-graphql", () => ({
  fetchGraphQL: fetchGraphQLMock
}));

beforeEach(() => {
  fetchGraphQLMock.mockReset();
});

test("Relay environment rejects top-level GraphQL errors for route-loader requests without fetchGraphQL parsing flags", async () => {
  const environment = createRelayEnvironment();
  const signal = new AbortController().signal;

  fetchGraphQLMock.mockResolvedValue({
    data: {
      product: null
    },
    errors: [{ message: "boom" }]
  });

  await expect(
    fetchQuery(
      environment,
      productDetailRouteQuery,
      {
        slug: "detail-product"
      },
      {
        networkCacheConfig: {
          metadata: {
            [RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY]: signal
          }
        }
      }
    ).toPromise()
  ).rejects.toThrow("GraphQL response contained errors: boom");

  expect(fetchGraphQL).toHaveBeenCalledWith(
    expect.stringContaining("query ProductDetailRouteQuery"),
    { slug: "detail-product" },
    expect.objectContaining({
      signal
    })
  );
  expect(fetchGraphQLMock.mock.calls[0]?.[2]).not.toHaveProperty("rejectGraphQLErrors");
});

test("Relay environment preserves default GraphQL error handling outside route-loader requests", async () => {
  const environment = createRelayEnvironment();

  fetchGraphQLMock.mockResolvedValue({
    data: {
      product: null
    }
  });

  await fetchQuery(environment, productDetailRouteQuery, {
    slug: "detail-product"
  }).toPromise();

  const ssrContext = fetchGraphQLMock.mock.calls[0]?.[2];

  expect(ssrContext?.rejectGraphQLErrors).toBeUndefined();
  expect(ssrContext?.signal).toBeUndefined();
});

test("Relay environment preserves an explicit SSR signal outside route-loader requests", async () => {
  const signal = new AbortController().signal;
  const environment = createRelayEnvironment({
    ssrContext: {
      signal
    }
  });

  fetchGraphQLMock.mockResolvedValue({
    data: {
      product: null
    }
  });

  await fetchQuery(environment, productDetailRouteQuery, {
    slug: "detail-product"
  }).toPromise();

  const ssrContext = fetchGraphQLMock.mock.calls[0]?.[2];

  expect(ssrContext?.rejectGraphQLErrors).toBeUndefined();
  expect(ssrContext?.signal).toBe(signal);
});

describe("hasGraphQLErrors", () => {
  test("returns false for null, non-object values, arrays, and missing errors", () => {
    expect(hasGraphQLErrors(null as never)).toBe(false);
    expect(hasGraphQLErrors(undefined as never)).toBe(false);
    expect(hasGraphQLErrors(42 as never)).toBe(false);
    expect(hasGraphQLErrors("not an object" as never)).toBe(false);
    expect(hasGraphQLErrors([1, 2, 3] as never)).toBe(false);
    expect(hasGraphQLErrors({ data: { product: null } })).toBe(false);
    expect(hasGraphQLErrors({ errors: [] })).toBe(false);
  });

  test("returns true when the errors array has entries", () => {
    expect(
      hasGraphQLErrors({
        data: { product: null },
        errors: [{ message: "boom" }]
      })
    ).toBe(true);
  });
});

describe("formatGraphQLErrorMessage", () => {
  test("formats multiple GraphQL top-level error messages", () => {
    expect(
      formatGraphQLErrorMessage({
        errors: [{ message: "first failure" }, { message: "second failure" }]
      })
    ).toBe("GraphQL response contained errors: first failure; second failure");
  });

  test("uses a generic message when no string error messages are present", () => {
    expect(
      formatGraphQLErrorMessage({
        errors: [{ message: 123 }, { message: null }, { foo: "bar" }]
      } as never)
    ).toBe("GraphQL response contained errors");
  });

  test("uses a generic message when errors are missing or empty", () => {
    expect(formatGraphQLErrorMessage({} as never)).toBe("GraphQL response contained errors");
    expect(formatGraphQLErrorMessage({ errors: [] })).toBe("GraphQL response contained errors");
  });
});
