import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../../src/relay/environment";
import { createRelayRouterContext, preloadRouteQuery } from "../../../src/relay/route-preload";
import { merchantDirectoryLoader } from "../../../src/routes/merchants/loader";
import { buildMerchantDirectoryPaginationData } from "../../../src/routes/merchants/pagination";

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload",
  );

  return {
    ...actual,
    preloadRouteQuery: vi.fn(),
  };
});

const preloadRouteQueryMock = vi.mocked(preloadRouteQuery);

const MERCHANT_DIRECTORY_QUERY_TEXT =
  "query MerchantDirectoryRouteQuery($first: Int, $after: String) { merchants(first: $first, after: $after) { edges { node { id } } } }";

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
});

test("buildMerchantDirectoryPaginationData returns page-size-preserving first and next paths", () => {
  expect(
    buildMerchantDirectoryPaginationData({
      endCursor: "next cursor/+",
      hasNextPage: true,
      hasPreviousPage: true,
      pagination: {
        after: "current-cursor",
        first: 35,
      },
    }),
  ).toEqual({
    firstHref: "/merchants?first=35",
    nextHref: "/merchants?first=35&after=next+cursor%2F%2B",
  });
});

test.each([
  [false, "current-cursor"],
  [true, null],
] as const)(
  "buildMerchantDirectoryPaginationData hides incomplete first-page facts",
  (hasPreviousPage, after) => {
    expect(
      buildMerchantDirectoryPaginationData({
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage,
        pagination: {
          after,
          first: 20,
        },
      }).firstHref,
    ).toBeNull();
  },
);

test.each([
  [false, "next-cursor"],
  [true, null],
] as const)(
  "buildMerchantDirectoryPaginationData hides incomplete next-page facts",
  (hasNextPage, endCursor) => {
    expect(
      buildMerchantDirectoryPaginationData({
        endCursor,
        hasNextPage,
        hasPreviousPage: false,
        pagination: {
          after: null,
          first: 20,
        },
      }).nextHref,
    ).toBeNull();
  },
);

test("buildMerchantDirectoryPaginationData does not mutate its input", () => {
  const input = Object.freeze({
    endCursor: "next-cursor",
    hasNextPage: true,
    hasPreviousPage: true,
    pagination: Object.freeze({
      after: "current-cursor",
      first: 50,
    }),
  });

  buildMerchantDirectoryPaginationData(input);

  expect(input).toEqual({
    endCursor: "next-cursor",
    hasNextPage: true,
    hasPreviousPage: true,
    pagination: {
      after: "current-cursor",
      first: 50,
    },
  });
});

test("merchantDirectoryLoader preloads the default merchant page", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/merchants");
  const descriptor = merchantDirectoryQueryDescriptor({ first: 20, after: null });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    merchantDirectoryLoader(buildMerchantDirectoryLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 20,
      after: null,
    },
    query: descriptor,
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20, after: null },
    { signal: request.signal },
  );
});

test("merchantDirectoryLoader preserves supported cursor and page-size params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/merchants?after=cursor-1&first=50");
  const descriptor = merchantDirectoryQueryDescriptor({ first: 50, after: "cursor-1" });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    merchantDirectoryLoader(buildMerchantDirectoryLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 50,
      after: "cursor-1",
    },
    query: descriptor,
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 50, after: "cursor-1" },
    { signal: request.signal },
  );
});

test("merchantDirectoryLoader drops invalid page-size params instead of broadening them", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/merchants?after=cursor-2&first=500");
  const descriptor = merchantDirectoryQueryDescriptor({ first: 20, after: "cursor-2" });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    merchantDirectoryLoader(buildMerchantDirectoryLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 20,
      after: "cursor-2",
    },
    query: descriptor,
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20, after: "cursor-2" },
    { signal: request.signal },
  );
});

test("merchantDirectoryLoader drops blank page-size params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/merchants?after=cursor-4&first=");
  const descriptor = merchantDirectoryQueryDescriptor({ first: 20, after: "cursor-4" });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    merchantDirectoryLoader(buildMerchantDirectoryLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 20,
      after: "cursor-4",
    },
    query: descriptor,
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20, after: "cursor-4" },
    { signal: request.signal },
  );
});

test("merchantDirectoryLoader drops malformed page-size params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/merchants?after=cursor-5&first=abc");
  const descriptor = merchantDirectoryQueryDescriptor({ first: 20, after: "cursor-5" });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    merchantDirectoryLoader(buildMerchantDirectoryLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 20,
      after: "cursor-5",
    },
    query: descriptor,
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20, after: "cursor-5" },
    { signal: request.signal },
  );
});

test("merchantDirectoryLoader returns error state when route preloading fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/merchants?after=cursor-3&first=30");
  const preloadError = new Error("Network request failed: merchant boom");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock.mockRejectedValue(preloadError);

  try {
    await expect(
      merchantDirectoryLoader(buildMerchantDirectoryLoaderArgs({ environment, request })),
    ).resolves.toEqual({
      status: "error",
      pagination: {
        first: 30,
        after: "cursor-3",
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to preload merchant directory route query.",
      {
        error: preloadError,
      },
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

function buildMerchantDirectoryLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.test/merchants"),
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}): LoaderFunctionArgs {
  return {
    request,
    params: {},
    context: createRelayRouterContext(environment),
    pattern: "/merchants",
    url: new URL(request.url),
  };
}

function merchantDirectoryQueryDescriptor(variables: { first: number; after: string | null }) {
  return {
    __relayQuery: {
      operationName: "MerchantDirectoryRouteQuery",
      text: MERCHANT_DIRECTORY_QUERY_TEXT,
      variables,
    },
  };
}
