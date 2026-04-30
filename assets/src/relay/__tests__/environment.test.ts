import { fetchQuery } from "relay-runtime";
import productDetailRouteQuery from "../../__generated__/ProductDetailRouteQuery.graphql";
import { fetchGraphQL } from "../fetch-graphql";
import { createRelayEnvironment } from "../environment";
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

test("Relay environment asks fetchGraphQL to reject top-level GraphQL errors for route-loader requests", async () => {
  const environment = createRelayEnvironment();
  const signal = new AbortController().signal;

  fetchGraphQLMock.mockResolvedValue({
    data: {
      product: null
    }
  });

  await fetchQuery(
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
  ).toPromise();

  expect(fetchGraphQL).toHaveBeenCalledWith(
    expect.stringContaining("query ProductDetailRouteQuery"),
    { slug: "detail-product" },
    expect.objectContaining({
      rejectGraphQLErrors: true,
      signal
    })
  );
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
