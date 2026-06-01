import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../../relay/environment";
import {
  createRelayRouterContext,
  preloadRouteQuery
} from "../../../relay/route-preload";
import { merchantDirectoryLoader } from "../loader";

vi.mock("../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../relay/route-preload")>(
    "../../../relay/route-preload"
  );

  return {
    ...actual,
    preloadRouteQuery: vi.fn()
  };
});

const preloadRouteQueryMock = vi.mocked(preloadRouteQuery);

const MERCHANT_DIRECTORY_QUERY_TEXT =
  "query MerchantDirectoryRouteQuery($first: Int, $after: String) { merchants(first: $first, after: $after) { edges { node { id } } } }";

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
});

test("merchantDirectoryLoader preloads the default merchant page", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/merchants");
  const descriptor = merchantDirectoryQueryDescriptor({ first: 20, after: null });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    merchantDirectoryLoader(buildMerchantDirectoryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 20,
      after: null
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20, after: null },
    { signal: request.signal }
  );
});

test("merchantDirectoryLoader preserves supported cursor and page-size params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/merchants?after=cursor-1&first=50");
  const descriptor = merchantDirectoryQueryDescriptor({ first: 50, after: "cursor-1" });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    merchantDirectoryLoader(buildMerchantDirectoryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 50,
      after: "cursor-1"
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 50, after: "cursor-1" },
    { signal: request.signal }
  );
});

test("merchantDirectoryLoader drops invalid page-size params instead of broadening them", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/merchants?after=cursor-2&first=500");
  const descriptor = merchantDirectoryQueryDescriptor({ first: 20, after: "cursor-2" });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    merchantDirectoryLoader(buildMerchantDirectoryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 20,
      after: "cursor-2"
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20, after: "cursor-2" },
    { signal: request.signal }
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
      merchantDirectoryLoader(buildMerchantDirectoryLoaderArgs({ environment, request }))
    ).resolves.toEqual({
      status: "error",
      pagination: {
        first: 30,
        after: "cursor-3"
      }
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to preload merchant directory route query.",
      {
        error: preloadError
      }
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

function buildMerchantDirectoryLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.test/merchants")
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

function merchantDirectoryQueryDescriptor(variables: { first: number; after: string | null }) {
  return {
    __relayQuery: {
      operationName: "MerchantDirectoryRouteQuery",
      text: MERCHANT_DIRECTORY_QUERY_TEXT,
      variables
    }
  };
}
