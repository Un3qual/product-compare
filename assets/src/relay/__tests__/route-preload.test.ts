import type { GraphQLTaggedNode } from "react-relay";
import { RouterContextProvider } from "react-router-dom";
import { createRelayEnvironment } from "../environment";
import { loadAppQuery } from "../load-query";
import {
  createRelayRouterContext,
  getRoutePreloadedQuery,
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery
} from "../route-preload";
import { dehydrateRelayEnvironment } from "../ssr";

vi.mock("../load-query", () => ({
  loadAppQuery: vi.fn()
}));

const routeQuery = {
  kind: "Request",
  params: {
    name: "BrowseProductsRouteQuery",
    text: "query BrowseProductsRouteQuery($first: Int!) { products(first: $first) { edges { node { id } } } }"
  }
} as unknown as GraphQLTaggedNode;

beforeEach(() => {
  vi.mocked(loadAppQuery).mockReset();
});

test("dehydrateRelayEnvironment returns the populated record source", () => {
  const environment = createRelayEnvironment({
    records: {
      "client:root": { __id: "client:root", __typename: "__Root" }
    }
  });

  expect(dehydrateRelayEnvironment(environment)).toEqual(
    expect.objectContaining({
      "client:root": expect.objectContaining({ __id: "client:root" })
    })
  );
});

test("preloadRouteQuery preloads the operation and returns a serializable descriptor", () => {
  const environment = createRelayEnvironment();
  const variables = { first: 12 };

  expect(preloadRouteQuery(environment, routeQuery, variables)).toEqual({
    __relayQuery: {
      operationName: "BrowseProductsRouteQuery",
      text: expect.stringContaining("query BrowseProductsRouteQuery"),
      variables
    }
  });

  expect(loadAppQuery).toHaveBeenCalledWith(environment, routeQuery, variables);
});

test("getRoutePreloadedQuery reuses a query reference already loaded for the descriptor", () => {
  const environment = createRelayEnvironment();
  const variables = { first: 12 };
  const queryRef = { dispose: vi.fn(), variables };

  vi.mocked(loadAppQuery).mockReturnValue(queryRef as never);

  const descriptor = preloadRouteQuery(environment, routeQuery, variables);

  vi.mocked(loadAppQuery).mockClear();

  expect(getRoutePreloadedQuery(environment, routeQuery, descriptor)).toBe(queryRef);
  expect(loadAppQuery).not.toHaveBeenCalled();
});

test("preloadRouteQuery reloads and replaces an unclaimed query reference for equivalent descriptor content", () => {
  const environment = createRelayEnvironment();
  const firstQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const secondQueryRef = { dispose: vi.fn(), variables: { first: 12 } };

  vi.mocked(loadAppQuery)
    .mockReturnValueOnce(firstQueryRef as never)
    .mockReturnValueOnce(secondQueryRef as never);

  const firstDescriptor = preloadRouteQuery(environment, routeQuery, { first: 12 });
  const secondDescriptor = preloadRouteQuery(environment, routeQuery, { first: 12 });

  expect(secondDescriptor).toEqual(firstDescriptor);
  expect(loadAppQuery).toHaveBeenCalledTimes(2);
  expect(firstQueryRef.dispose).toHaveBeenCalledTimes(1);
  expect(secondQueryRef.dispose).not.toHaveBeenCalled();
});

test("preloadRouteQuery uses stable nested variable keys when replacing unclaimed query refs", () => {
  const environment = createRelayEnvironment();
  const firstQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const secondQueryRef = { dispose: vi.fn(), variables: { first: 12 } };

  vi.mocked(loadAppQuery)
    .mockReturnValueOnce(firstQueryRef as never)
    .mockReturnValueOnce(secondQueryRef as never);

  preloadRouteQuery(environment, routeQuery, {
    first: 12,
    filters: {
      brandIds: ["brand-1"],
      useCaseTaxonIds: ["taxon-1"]
    }
  });
  preloadRouteQuery(environment, routeQuery, {
    filters: {
      useCaseTaxonIds: ["taxon-1"],
      brandIds: ["brand-1"]
    },
    first: 12
  });

  expect(loadAppQuery).toHaveBeenCalledTimes(2);
  expect(firstQueryRef.dispose).toHaveBeenCalledTimes(1);
  expect(secondQueryRef.dispose).not.toHaveBeenCalled();
});

test("getRoutePreloadedQuery consumes the loader-created cache entry", () => {
  const environment = createRelayEnvironment();
  const firstQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const secondQueryRef = { dispose: vi.fn(), variables: { first: 12 } };

  vi.mocked(loadAppQuery)
    .mockReturnValueOnce(firstQueryRef as never)
    .mockReturnValueOnce(secondQueryRef as never);

  const descriptor = preloadRouteQuery(environment, routeQuery, { first: 12 });

  expect(getRoutePreloadedQuery(environment, routeQuery, descriptor)).toBe(firstQueryRef);

  preloadRouteQuery(environment, routeQuery, { first: 12 });

  expect(loadAppQuery).toHaveBeenCalledTimes(2);
  expect(firstQueryRef.dispose).not.toHaveBeenCalled();
  expect(secondQueryRef.dispose).not.toHaveBeenCalled();
});

test("preloadRouteQuery disposes the oldest cached query references when the cache limit is exceeded", () => {
  const environment = createRelayEnvironment();
  const queryRefs: Array<{ dispose: ReturnType<typeof vi.fn>; variables: { first: number } }> = [];

  vi.mocked(loadAppQuery).mockImplementation((_environment, _query, variables) => {
    const queryRef = { dispose: vi.fn(), variables: variables as { first: number } };
    queryRefs.push(queryRef);

    return queryRef as never;
  });

  for (let first = 1; first <= 21; first += 1) {
    preloadRouteQuery(environment, routeQuery, { first });
  }

  expect(queryRefs).toHaveLength(21);
  expect(queryRefs[0]?.dispose).toHaveBeenCalledTimes(1);
  expect(queryRefs[20]?.dispose).not.toHaveBeenCalled();
});

test("createRelayRouterContext exposes the Relay environment to route loaders", () => {
  const environment = createRelayEnvironment();
  const context = createRelayRouterContext(environment);

  expect(getRelayEnvironmentFromRouterContext(context)).toBe(environment);
});

test("getRelayEnvironmentFromRouterContext throws when the provider has no Relay environment", () => {
  const context = new RouterContextProvider();

  expect(() => getRelayEnvironmentFromRouterContext(context)).toThrow(
    "Relay environment is missing from the route loader context"
  );
});
