import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../../../src/relay/environment";
import { createRelayRouterContext, preloadRouteQuery } from "../../../../src/relay/route-preload";
import { revenueSummaryLoader } from "../../../../src/routes/commerce/revenue/loader";

vi.mock("../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/relay/route-preload")>(
    "../../../../src/relay/route-preload",
  );

  return {
    ...actual,
    preloadRouteQuery: vi.fn(),
  };
});

const preloadRouteQueryMock = vi.mocked(preloadRouteQuery);

const REVENUE_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "RevenueSummaryRouteQuery",
    text: "query RevenueSummaryRouteQuery($input: RevenueSummaryInput) { revenueSummary(input: $input) { filters { currency } } }",
    variables: {
      input: null,
    },
  },
};

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
});

test("revenueSummaryLoader asks for currency before preloading the summary query", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/commerce/revenue");

  await expect(
    revenueSummaryLoader(buildRevenueSummaryLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "needsCurrency",
    filters: {},
  });

  expect(preloadRouteQueryMock).not.toHaveBeenCalled();
});

test("revenueSummaryLoader normalizes supported network currency and date filters", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/commerce/revenue?network=Impact&currency=usd&from=2026-05-01&to=2026-05-31",
  );
  const descriptor = revenueSummaryQueryDescriptor({
    input: {
      currency: "USD",
      from: "2026-05-01",
      network: "impact",
      to: "2026-05-31",
    },
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    revenueSummaryLoader(buildRevenueSummaryLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "ready",
    filters: {
      currency: "USD",
      from: "2026-05-01",
      network: "impact",
      to: "2026-05-31",
    },
    query: descriptor,
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      input: {
        currency: "USD",
        from: "2026-05-01",
        network: "impact",
        to: "2026-05-31",
      },
    },
    { signal: request.signal },
  );
});

test("revenueSummaryLoader drops invalid scalar filters before preloading", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/commerce/revenue?network=unknown-network&currency=usd&from=2026-02-30&to=2026-05-31",
  );
  const descriptor = revenueSummaryQueryDescriptor({
    input: {
      currency: "USD",
      to: "2026-05-31",
    },
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    revenueSummaryLoader(buildRevenueSummaryLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "ready",
    filters: {
      currency: "USD",
      to: "2026-05-31",
    },
    query: descriptor,
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      input: {
        currency: "USD",
        to: "2026-05-31",
      },
    },
    { signal: request.signal },
  );
});

test("revenueSummaryLoader rejects inverted date ranges before preloading", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/commerce/revenue?currency=usd&from=2026-06-01&to=2026-05-31",
  );

  await expect(
    revenueSummaryLoader(buildRevenueSummaryLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "invalidDateRange",
    filters: {
      currency: "USD",
      from: "2026-06-01",
      to: "2026-05-31",
    },
  });

  expect(preloadRouteQueryMock).not.toHaveBeenCalled();
});

test("revenueSummaryLoader drops invalid currency and waits for a supported currency", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/commerce/revenue?network=impact&currency=US&from=2026-05-01",
  );

  await expect(
    revenueSummaryLoader(buildRevenueSummaryLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "needsCurrency",
    filters: {
      from: "2026-05-01",
      network: "impact",
    },
  });

  expect(preloadRouteQueryMock).not.toHaveBeenCalled();
});

test("revenueSummaryLoader returns error state when route preloading fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/commerce/revenue?network=Impact&currency=usd",
  );
  const preloadError = new Error("Network request failed: revenue boom");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock.mockRejectedValue(preloadError);

  try {
    await expect(
      revenueSummaryLoader(buildRevenueSummaryLoaderArgs({ environment, request })),
    ).resolves.toEqual({
      status: "error",
      filters: {
        currency: "USD",
        network: "impact",
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload revenue summary route query.", {
      error: preloadError,
    });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

function buildRevenueSummaryLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.test/commerce/revenue"),
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}): LoaderFunctionArgs {
  return {
    request,
    params: {},
    context: createRelayRouterContext(environment),
    pattern: "/commerce/revenue",
    url: new URL(request.url),
  };
}

function revenueSummaryQueryDescriptor(variables: {
  input: {
    currency?: string;
    from?: string;
    network?: string;
    to?: string;
  } | null;
}) {
  return {
    __relayQuery: {
      operationName: "RevenueSummaryRouteQuery",
      text: REVENUE_QUERY_DESCRIPTOR.__relayQuery.text,
      variables,
    },
  };
}
