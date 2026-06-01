import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../../../relay/environment";
import {
  createRelayRouterContext,
  preloadRouteQuery
} from "../../../../relay/route-preload";
import { revenueSummaryLoader } from "../loader";

vi.mock("../../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../relay/route-preload")>(
    "../../../../relay/route-preload"
  );

  return {
    ...actual,
    preloadRouteQuery: vi.fn()
  };
});

const preloadRouteQueryMock = vi.mocked(preloadRouteQuery);

const REVENUE_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "RevenueSummaryRouteQuery",
    text: "query RevenueSummaryRouteQuery($input: RevenueSummaryInput) { revenueSummary(input: $input) { filters { currency } } }",
    variables: {
      input: null
    }
  }
};

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
});

test("revenueSummaryLoader preloads the default aggregate summary query", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/commerce/revenue");

  preloadRouteQueryMock.mockResolvedValue(REVENUE_QUERY_DESCRIPTOR);

  await expect(
    revenueSummaryLoader(buildRevenueSummaryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    filters: {},
    query: REVENUE_QUERY_DESCRIPTOR
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      input: null
    },
    { signal: request.signal }
  );
});

test("revenueSummaryLoader normalizes supported network currency and date filters", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/commerce/revenue?network=Impact&currency=usd&from=2026-05-01&to=2026-05-31"
  );
  const descriptor = revenueSummaryQueryDescriptor({
    input: {
      currency: "USD",
      from: "2026-05-01",
      network: "impact",
      to: "2026-05-31"
    }
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    revenueSummaryLoader(buildRevenueSummaryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    filters: {
      currency: "USD",
      from: "2026-05-01",
      network: "impact",
      to: "2026-05-31"
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      input: {
        currency: "USD",
        from: "2026-05-01",
        network: "impact",
        to: "2026-05-31"
      }
    },
    { signal: request.signal }
  );
});

test("revenueSummaryLoader drops invalid scalar filters instead of broadening them", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/commerce/revenue?network=impact!&currency=US&from=not-a-date&to=2026-05-31"
  );
  const descriptor = revenueSummaryQueryDescriptor({
    input: {
      to: "2026-05-31"
    }
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    revenueSummaryLoader(buildRevenueSummaryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    filters: {
      to: "2026-05-31"
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      input: {
        to: "2026-05-31"
      }
    },
    { signal: request.signal }
  );
});

test("revenueSummaryLoader returns error state when route preloading fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/commerce/revenue?network=Impact&currency=usd"
  );
  const preloadError = new Error("Network request failed: revenue boom");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock.mockRejectedValue(preloadError);

  try {
    await expect(
      revenueSummaryLoader(buildRevenueSummaryLoaderArgs({ environment, request }))
    ).resolves.toEqual({
      status: "error",
      filters: {
        currency: "USD",
        network: "impact"
      }
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to preload revenue summary route query.",
      {
        error: preloadError
      }
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

function buildRevenueSummaryLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.test/commerce/revenue")
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}): LoaderFunctionArgs {
  return {
    request,
    params: {},
    context: createRelayRouterContext(environment)
  } as LoaderFunctionArgs;
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
      variables
    }
  };
}
