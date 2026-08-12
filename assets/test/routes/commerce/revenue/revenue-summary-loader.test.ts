import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../../../src/relay/environment";
import { createRelayRouterContext, preloadRouteQuery } from "../../../../src/relay/route-preload";
import {
  revenueSummaryLoader,
  type RevenueSummaryLoaderData,
} from "../../../../src/routes/commerce/revenue/RevenueSummaryRoute";
import { ATTRIBUTION_LEDGER_PAGE_SIZE } from "../../../../src/routes/commerce/revenue/revenue-summary-view-data";

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
  const filters = {
    currency: "USD",
    from: "2026-05-01",
    network: "impact",
    to: "2026-05-31",
  };
  const descriptor = revenueSummaryQueryDescriptor({ input: filters });
  const ledgerDescriptor = attributionLedgerQueryDescriptor(filters);

  preloadRouteQueryMock.mockResolvedValueOnce(descriptor).mockResolvedValueOnce(ledgerDescriptor);

  const loaderData = await revenueSummaryLoader(
    buildRevenueSummaryLoaderArgs({ environment, request }),
  );

  expect(loaderData).toMatchObject({
    status: "ready",
    filters,
    query: descriptor,
  });

  if (loaderData.status !== "ready") {
    throw new Error("Expected ready revenue summary loader data");
  }

  await expect(Promise.resolve(loaderData.ledgerQuery)).resolves.toEqual(ledgerDescriptor);

  expect(preloadRouteQueryMock).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { input: filters },
    { signal: request.signal },
  );
  expect(preloadRouteQueryMock).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { input: filters, after: null, first: ATTRIBUTION_LEDGER_PAGE_SIZE },
    { signal: request.signal },
  );
});

test("revenueSummaryLoader drops invalid scalar filters before preloading", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/commerce/revenue?network=unknown-network&currency=usd&from=2026-02-30&to=2026-05-31",
  );
  const filters = {
    currency: "USD",
    to: "2026-05-31",
  };
  const descriptor = revenueSummaryQueryDescriptor({ input: filters });
  const ledgerDescriptor = attributionLedgerQueryDescriptor(filters);

  preloadRouteQueryMock.mockResolvedValueOnce(descriptor).mockResolvedValueOnce(ledgerDescriptor);

  const loaderData = await revenueSummaryLoader(
    buildRevenueSummaryLoaderArgs({ environment, request }),
  );

  expect(loaderData).toMatchObject({
    status: "ready",
    filters,
    query: descriptor,
  });

  if (loaderData.status !== "ready") {
    throw new Error("Expected ready revenue summary loader data");
  }

  await expect(Promise.resolve(loaderData.ledgerQuery)).resolves.toEqual(ledgerDescriptor);

  expect(preloadRouteQueryMock).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { input: filters },
    { signal: request.signal },
  );
  expect(preloadRouteQueryMock).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { input: filters, after: null, first: ATTRIBUTION_LEDGER_PAGE_SIZE },
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

test("revenueSummaryLoader keeps a successful summary when ledger preloading fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/commerce/revenue?network=Impact&currency=usd",
  );
  const ledgerError = new Error("ledger unavailable");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock
    .mockResolvedValueOnce(REVENUE_QUERY_DESCRIPTOR)
    .mockRejectedValueOnce(ledgerError);

  try {
    const loaderData = await revenueSummaryLoader(
      buildRevenueSummaryLoaderArgs({ environment, request }),
    );

    expect(loaderData).toMatchObject({
      status: "ready",
      filters: {
        currency: "USD",
        network: "impact",
      },
      query: REVENUE_QUERY_DESCRIPTOR,
    });

    if (loaderData.status !== "ready") {
      throw new Error("Expected ready revenue summary loader data");
    }

    await expect(Promise.resolve(loaderData.ledgerQuery)).resolves.toBeNull();

    expect(preloadRouteQueryMock).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to preload attribution ledger route query.",
      { error: ledgerError },
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("revenueSummaryLoader returns the summary without waiting for the ledger preload", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/commerce/revenue?currency=usd");
  const ledgerPreload = deferredPromise<ReturnType<typeof attributionLedgerQueryDescriptor>>();
  let loaderData: RevenueSummaryLoaderData | undefined;

  preloadRouteQueryMock
    .mockResolvedValueOnce(REVENUE_QUERY_DESCRIPTOR)
    .mockImplementationOnce(() => ledgerPreload.promise);

  const loaderResult = revenueSummaryLoader(
    buildRevenueSummaryLoaderArgs({ environment, request }),
  ).then((result) => {
    loaderData = result;
    return result;
  });

  await flushMicrotasks();

  expect(loaderData).toMatchObject({
    status: "ready",
    query: REVENUE_QUERY_DESCRIPTOR,
  });

  if (loaderData?.status !== "ready") {
    throw new Error("Expected the summary loader to resolve before the ledger preload");
  }

  expect(loaderData.ledgerQuery).toBeInstanceOf(Promise);

  const ledgerDescriptor = attributionLedgerQueryDescriptor({ currency: "USD" });
  ledgerPreload.resolve(ledgerDescriptor);

  await expect(Promise.resolve(loaderData.ledgerQuery)).resolves.toEqual(ledgerDescriptor);
  await expect(loaderResult).resolves.toBe(loaderData);
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

function attributionLedgerQueryDescriptor(input: {
  currency?: string;
  from?: string;
  network?: string;
  to?: string;
}) {
  return {
    __relayQuery: {
      operationName: "AttributionLedgerRouteQuery",
      text: "query AttributionLedgerRouteQuery($input: RevenueSummaryInput, $after: String, $first: Int!) { commerceAttributionClicks(input: $input, after: $after, first: $first) { edges { cursor } } }",
      variables: {
        input,
        after: null,
        first: ATTRIBUTION_LEDGER_PAGE_SIZE,
      },
    },
  };
}

function deferredPromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

async function flushMicrotasks() {
  for (let index = 0; index < 4; index += 1) {
    await Promise.resolve();
  }
}
