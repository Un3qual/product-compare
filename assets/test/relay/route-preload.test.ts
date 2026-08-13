import { StrictMode, createElement } from "react";
import { act, render } from "@testing-library/react";
import { RelayEnvironmentProvider, loadQuery, type GraphQLTaggedNode } from "react-relay";
import { RouterContextProvider } from "react-router-dom";
import { createRelayEnvironment } from "../../src/relay/environment";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery,
} from "../../src/__generated__/ProductDetailRouteQuery.graphql";
import { fetchAppQuery } from "../../src/relay/load-query";
import {
  cacheRouteQueryData,
  createRelayRouterContext,
  fetchRouteQuery,
  getRoutePreloadedQuery,
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  relayRouteQueryDescriptorIdentity,
  useRoutePreloadedQuery,
} from "../../src/relay/route-preload";
import { dehydrateRelayEnvironment } from "../../src/relay/ssr";

vi.mock("../../src/relay/load-query", () => ({
  fetchAppQuery: vi.fn(),
  RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY: "routeLoaderSignal",
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return { ...actual, loadQuery: vi.fn() };
});

const routeQuery = {
  kind: "Request",
  params: {
    name: "BrowseProductsRouteQuery",
    text: "query BrowseProductsRouteQuery($first: Int!) { products(first: $first) { edges { node { id } } } }",
  },
} as unknown as GraphQLTaggedNode;

beforeEach(() => {
  vi.mocked(fetchAppQuery).mockReset();
  vi.mocked(fetchAppQuery).mockResolvedValue({});
  vi.mocked(loadQuery).mockReset();
});

const flushRouteQueryRefDisposalTimers = () => {
  act(() => {
    vi.runOnlyPendingTimers();
  });
};

test("relay route query descriptor identity is stable across variable property order", () => {
  const firstIdentity = relayRouteQueryDescriptorIdentity({
    __relayQuery: {
      operationName: "BrowseProductsRouteQuery",
      text: "query BrowseProductsRouteQuery($first: Int!, $after: String) { products(first: $first, after: $after) { edges { node { id } } } }",
      variables: { first: 12, after: "cursor-1" },
    },
  });
  const secondIdentity = relayRouteQueryDescriptorIdentity({
    __relayQuery: {
      operationName: "BrowseProductsRouteQuery",
      text: "query BrowseProductsRouteQuery($first: Int!, $after: String) { products(first: $first, after: $after) { edges { node { id } } } }",
      variables: { after: "cursor-1", first: 12 },
    },
  });

  expect(secondIdentity).toBe(firstIdentity);
});

test("relay route query descriptor identity includes query text", () => {
  const descriptor = {
    __relayQuery: {
      operationName: "BrowseProductsRouteQuery",
      variables: { first: 12 },
    },
  };

  expect(
    relayRouteQueryDescriptorIdentity({
      __relayQuery: {
        ...descriptor.__relayQuery,
        text: "query BrowseProductsRouteQuery($first: Int!) { products(first: $first) { edges { node { id } } } }",
      },
    }),
  ).not.toBe(
    relayRouteQueryDescriptorIdentity({
      __relayQuery: {
        ...descriptor.__relayQuery,
        text: "query BrowseProductsRouteQuery($first: Int!) { products(first: $first) { totalCount } }",
      },
    }),
  );
});

test("dehydrateRelayEnvironment returns the populated record source", () => {
  const environment = createRelayEnvironment({
    records: {
      "client:root": { __id: "client:root", __typename: "__Root" },
    },
  });

  expect(dehydrateRelayEnvironment(environment)).toEqual(
    expect.objectContaining({
      "client:root": expect.objectContaining({ __id: "client:root" }),
    }),
  );
});

test("preloadRouteQuery fetches fresh data before retaining a store-only query ref", async () => {
  const environment = createRelayEnvironment();
  const variables = { first: 12 };
  const queryRef = { dispose: vi.fn(), variables };
  let resolveFetch: (value: unknown) => void = () => undefined;
  const fetchPromise = new Promise((resolve) => {
    resolveFetch = resolve;
  });

  vi.mocked(fetchAppQuery).mockReturnValue(fetchPromise as never);
  vi.mocked(loadQuery).mockReturnValue(queryRef as never);

  const descriptorPromise = preloadRouteQuery(environment, routeQuery, variables);

  expect(fetchAppQuery).toHaveBeenCalledWith(environment, routeQuery, variables, {
    fetchPolicy: "network-only",
  });
  expect(loadQuery).not.toHaveBeenCalled();

  resolveFetch({});

  await expect(descriptorPromise).resolves.toEqual({
    __relayQuery: {
      operationName: "BrowseProductsRouteQuery",
      text: expect.stringContaining("query BrowseProductsRouteQuery"),
      variables,
    },
  });

  expect(loadQuery).toHaveBeenCalledWith(environment, routeQuery, variables, {
    fetchPolicy: "store-only",
  });
});

test("preloadRouteQuery forwards the route loader abort signal to the network refresh", async () => {
  const environment = createRelayEnvironment();
  const variables = { first: 12 };
  const signal = new AbortController().signal;

  vi.mocked(loadQuery).mockReturnValue({ dispose: vi.fn(), variables } as never);

  await preloadRouteQuery(environment, routeQuery, variables, { signal });

  expect(fetchAppQuery).toHaveBeenCalledWith(environment, routeQuery, variables, {
    fetchPolicy: "network-only",
    networkCacheConfig: {
      metadata: {
        routeLoaderSignal: signal,
      },
    },
  });
});

test("fetchRouteQuery returns fetched data with the serializable descriptor and disposal handle", async () => {
  const environment = createRelayEnvironment();
  const variables = { first: 12 };
  const queryRef = { dispose: vi.fn(), variables };
  const data = {
    products: {
      edges: [],
    },
  };

  vi.mocked(fetchAppQuery).mockResolvedValue(data);
  vi.mocked(loadQuery).mockReturnValue(queryRef as never);

  const fetchedQuery = await fetchRouteQuery(environment, routeQuery, variables);

  expect(fetchedQuery).toEqual({
    data,
    descriptor: {
      __relayQuery: {
        operationName: "BrowseProductsRouteQuery",
        text: expect.stringContaining("query BrowseProductsRouteQuery"),
        variables,
      },
    },
    dispose: expect.any(Function),
  });

  expect(fetchAppQuery).toHaveBeenCalledWith(environment, routeQuery, variables, {
    fetchPolicy: "network-only",
  });
  expect(loadQuery).toHaveBeenCalledWith(environment, routeQuery, variables, {
    fetchPolicy: "store-only",
  });

  fetchedQuery.dispose();

  expect(queryRef.dispose).toHaveBeenCalledTimes(1);
});

test("cacheRouteQueryData normalizes partial data and retains a store-only query ref", () => {
  const environment = createRelayEnvironment();
  const commitPayloadSpy = vi.spyOn(environment, "commitPayload");
  const variables: ProductDetailRouteQuery["variables"] = {
    slug: "detail-product",
    offerFirst: 6,
    offersAfter: null,
  };
  const data: ProductDetailRouteQuery["response"] = {
    product: null,
  };
  const queryRef = { dispose: vi.fn(), variables };

  vi.mocked(loadQuery).mockReturnValue(queryRef as never);

  const descriptor = cacheRouteQueryData<ProductDetailRouteQuery>(
    environment,
    productDetailRouteQuery,
    variables,
    data,
  );

  expect(commitPayloadSpy).toHaveBeenCalledWith(expect.anything(), data);
  expect(loadQuery).toHaveBeenCalledWith(environment, productDetailRouteQuery, variables, {
    fetchPolicy: "store-only",
  });

  vi.mocked(loadQuery).mockClear();

  const preloadedQuery = getRoutePreloadedQuery(environment, productDetailRouteQuery, descriptor);

  expect(preloadedQuery.variables).toBe(queryRef.variables);
  expect(loadQuery).not.toHaveBeenCalled();
});

test("getRoutePreloadedQuery reuses a query reference already loaded for the descriptor", async () => {
  const environment = createRelayEnvironment();
  const variables = { first: 12 };
  const queryRef = { dispose: vi.fn(), variables };

  vi.mocked(loadQuery).mockReturnValue(queryRef as never);

  const descriptor = await preloadRouteQuery(environment, routeQuery, variables);

  vi.mocked(loadQuery).mockClear();

  const preloadedQuery = getRoutePreloadedQuery(environment, routeQuery, descriptor);

  expect(preloadedQuery).not.toBe(queryRef);
  expect(preloadedQuery.variables).toBe(queryRef.variables);
  expect(loadQuery).not.toHaveBeenCalled();
});

test("getRoutePreloadedQuery uses the hydrated store when the route cache is empty", () => {
  const environment = createRelayEnvironment();
  const variables = { first: 12 };
  const queryRef = { dispose: vi.fn(), variables };

  vi.mocked(loadQuery).mockReturnValue(queryRef as never);

  const descriptor = {
    __relayQuery: {
      operationName: "BrowseProductsRouteQuery",
      text: "query BrowseProductsRouteQuery($first: Int!) { products(first: $first) { edges { node { id } } } }",
      variables,
    },
  };

  const preloadedQuery = getRoutePreloadedQuery(environment, routeQuery, descriptor);

  expect(preloadedQuery.variables).toBe(queryRef.variables);
  expect(loadQuery).toHaveBeenCalledWith(environment, routeQuery, variables, {
    fetchPolicy: "store-only",
  });
});

test("preloadRouteQuery reloads and replaces an unclaimed query reference for equivalent descriptor content", async () => {
  const environment = createRelayEnvironment();
  const firstQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const secondQueryRef = { dispose: vi.fn(), variables: { first: 12 } };

  vi.mocked(loadQuery)
    .mockReturnValueOnce(firstQueryRef as never)
    .mockReturnValueOnce(secondQueryRef as never);

  const firstDescriptor = await preloadRouteQuery(environment, routeQuery, { first: 12 });
  const secondDescriptor = await preloadRouteQuery(environment, routeQuery, { first: 12 });

  expect(secondDescriptor).toEqual(firstDescriptor);
  expect(loadQuery).toHaveBeenCalledTimes(2);
  expect(firstQueryRef.dispose).toHaveBeenCalledTimes(1);
  expect(secondQueryRef.dispose).not.toHaveBeenCalled();
});

test("preloadRouteQuery uses stable nested variable keys when replacing unclaimed query refs", async () => {
  const environment = createRelayEnvironment();
  const firstQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const secondQueryRef = { dispose: vi.fn(), variables: { first: 12 } };

  vi.mocked(loadQuery)
    .mockReturnValueOnce(firstQueryRef as never)
    .mockReturnValueOnce(secondQueryRef as never);

  await preloadRouteQuery(environment, routeQuery, {
    first: 12,
    filters: {
      brandIds: ["brand-1"],
      useCaseTaxonIds: ["taxon-1"],
    },
  });
  await preloadRouteQuery(environment, routeQuery, {
    filters: {
      useCaseTaxonIds: ["taxon-1"],
      brandIds: ["brand-1"],
    },
    first: 12,
  });

  expect(loadQuery).toHaveBeenCalledTimes(2);
  expect(firstQueryRef.dispose).toHaveBeenCalledTimes(1);
  expect(secondQueryRef.dispose).not.toHaveBeenCalled();
});

test("uncommitted route query refs stay replaceable if render aborts before effects run", async () => {
  const environment = createRelayEnvironment();
  const firstQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
  const secondQueryRef = { dispose: vi.fn(), variables: { first: 12 } };

  vi.mocked(loadQuery)
    .mockReturnValueOnce(firstQueryRef as never)
    .mockReturnValueOnce(secondQueryRef as never);

  const descriptor = await preloadRouteQuery(environment, routeQuery, { first: 12 });

  const preloadedQuery = getRoutePreloadedQuery(environment, routeQuery, descriptor);

  expect(preloadedQuery).not.toBe(firstQueryRef);
  expect(preloadedQuery.variables).toBe(firstQueryRef.variables);

  await preloadRouteQuery(environment, routeQuery, { first: 12 });

  expect(loadQuery).toHaveBeenCalledTimes(2);
  expect(firstQueryRef.dispose).toHaveBeenCalledTimes(1);
  expect(secondQueryRef.dispose).not.toHaveBeenCalled();
});

test("committed route query refs are claimed so later preloads do not dispose them", async () => {
  vi.useFakeTimers();

  try {
    const environment = createRelayEnvironment();
    const firstQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
    const secondQueryRef = { dispose: vi.fn(), variables: { first: 12 } };
    let renderedQueryRef: unknown;

    vi.mocked(loadQuery)
      .mockReturnValueOnce(firstQueryRef as never)
      .mockReturnValueOnce(secondQueryRef as never);

    const descriptor = await preloadRouteQuery(environment, routeQuery, { first: 12 });

    const RouteQueryConsumer = () => {
      renderedQueryRef = useRoutePreloadedQuery(routeQuery, descriptor);

      return null;
    };

    const view = render(
      createElement(RelayEnvironmentProvider, {
        environment,
        children: createElement(RouteQueryConsumer),
      }),
    );

    expect(renderedQueryRef).not.toBe(firstQueryRef);
    expect((renderedQueryRef as typeof firstQueryRef).variables).toBe(firstQueryRef.variables);

    await preloadRouteQuery(environment, routeQuery, { first: 12 });

    expect(loadQuery).toHaveBeenCalledTimes(2);
    expect(firstQueryRef.dispose).not.toHaveBeenCalled();
    expect(secondQueryRef.dispose).not.toHaveBeenCalled();

    view.unmount();
    flushRouteQueryRefDisposalTimers();

    expect(firstQueryRef.dispose).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});

test("multiple committed consumers release a shared route query ref after the last unmount", async () => {
  vi.useFakeTimers();

  try {
    const environment = createRelayEnvironment();
    const queryRef = { dispose: vi.fn(), variables: { first: 12 } };
    const renderedQueryRefs: unknown[] = [];

    vi.mocked(loadQuery).mockReturnValue(queryRef as never);

    const descriptor = await preloadRouteQuery(environment, routeQuery, { first: 12 });

    const RouteQueryConsumer = ({ index }: { index: number }) => {
      renderedQueryRefs[index] = useRoutePreloadedQuery(routeQuery, descriptor);

      return null;
    };

    const RouteQueryConsumers = ({ count }: { count: number }) => {
      return createElement(
        "div",
        null,
        Array.from({ length: count }, (_, index) =>
          createElement(RouteQueryConsumer, { key: index, index }),
        ),
      );
    };

    const view = render(
      createElement(RelayEnvironmentProvider, {
        environment,
        children: createElement(RouteQueryConsumers, { count: 2 }),
      }),
    );

    expect(renderedQueryRefs[0]).not.toBe(renderedQueryRefs[1]);
    expect(queryRef.dispose).not.toHaveBeenCalled();

    view.rerender(
      createElement(RelayEnvironmentProvider, {
        environment,
        children: createElement(RouteQueryConsumers, { count: 1 }),
      }),
    );

    expect(queryRef.dispose).not.toHaveBeenCalled();

    view.unmount();
    flushRouteQueryRefDisposalTimers();

    expect(queryRef.dispose).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});

test("StrictMode effect replay keeps the active route query ref alive", async () => {
  vi.useFakeTimers();

  try {
    const environment = createRelayEnvironment();
    const queryRef = { dispose: vi.fn(), variables: { first: 12 } };

    vi.mocked(loadQuery).mockReturnValue(queryRef as never);

    const descriptor = await preloadRouteQuery(environment, routeQuery, { first: 12 });

    const RouteQueryConsumer = () => {
      useRoutePreloadedQuery(routeQuery, descriptor);

      return null;
    };

    const view = render(
      createElement(
        StrictMode,
        null,
        createElement(RelayEnvironmentProvider, {
          environment,
          children: createElement(RouteQueryConsumer),
        }),
      ),
    );

    expect(queryRef.dispose).not.toHaveBeenCalled();

    view.unmount();
    flushRouteQueryRefDisposalTimers();

    expect(queryRef.dispose).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});

test("preloadRouteQuery disposes the oldest cached query references when the cache limit is exceeded", async () => {
  const environment = createRelayEnvironment();
  const queryRefs: Array<{ dispose: ReturnType<typeof vi.fn>; variables: { first: number } }> = [];

  vi.mocked(loadQuery).mockImplementation((_environment, _query, variables) => {
    const queryRef = { dispose: vi.fn(), variables: variables as { first: number } };
    queryRefs.push(queryRef);

    return queryRef as never;
  });

  for (let first = 1; first <= 51; first += 1) {
    await preloadRouteQuery(environment, routeQuery, { first });
  }

  expect(queryRefs).toHaveLength(51);
  expect(queryRefs[0]?.dispose).toHaveBeenCalledTimes(1);
  expect(queryRefs[50]?.dispose).not.toHaveBeenCalled();
});

test("preloadRouteQuery retains enough query references for the saved-comparisons page cap", async () => {
  const environment = createRelayEnvironment();
  const queryRefs: Array<{ dispose: ReturnType<typeof vi.fn>; variables: { first: number } }> = [];

  vi.mocked(loadQuery).mockImplementation((_environment, _query, variables) => {
    const queryRef = { dispose: vi.fn(), variables: variables as { first: number } };
    queryRefs.push(queryRef);

    return queryRef as never;
  });

  for (let first = 1; first <= 50; first += 1) {
    await preloadRouteQuery(environment, routeQuery, { first });
  }

  expect(queryRefs).toHaveLength(50);
  expect(queryRefs[0]?.dispose).not.toHaveBeenCalled();
  expect(queryRefs[49]?.dispose).not.toHaveBeenCalled();
});

test("route query ref eviction keeps recently used descriptors cached", async () => {
  const environment = createRelayEnvironment();
  const descriptors = [];
  const queryRefs: Array<{ dispose: ReturnType<typeof vi.fn>; variables: { first: number } }> = [];

  vi.mocked(loadQuery).mockImplementation((_environment, _query, variables) => {
    const queryRef = { dispose: vi.fn(), variables: variables as { first: number } };
    queryRefs.push(queryRef);

    return queryRef as never;
  });

  for (let first = 1; first <= 50; first += 1) {
    descriptors.push(await preloadRouteQuery(environment, routeQuery, { first }));
  }

  getRoutePreloadedQuery(environment, routeQuery, descriptors[0]);

  await preloadRouteQuery(environment, routeQuery, { first: 51 });

  expect(queryRefs).toHaveLength(51);
  expect(queryRefs[0]?.dispose).not.toHaveBeenCalled();
  expect(queryRefs[1]?.dispose).toHaveBeenCalledTimes(1);
  expect(queryRefs[50]?.dispose).not.toHaveBeenCalled();
});

test("createRelayRouterContext exposes the Relay environment to route loaders", () => {
  const environment = createRelayEnvironment();
  const context = createRelayRouterContext(environment);

  expect(getRelayEnvironmentFromRouterContext(context)).toBe(environment);
});

test("getRelayEnvironmentFromRouterContext throws when the provider has no Relay environment", () => {
  const context = new RouterContextProvider();

  expect(() => getRelayEnvironmentFromRouterContext(context)).toThrow(
    "Relay environment is missing from the route loader context",
  );
});
