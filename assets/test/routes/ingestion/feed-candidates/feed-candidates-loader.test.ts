import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../../../src/relay/environment";
import {
  createRelayRouterContext,
  preloadRouteQuery
} from "../../../../src/relay/route-preload";
import { feedCandidatesLoader } from "../../../../src/routes/ingestion/feed-candidates/loader";

vi.mock("../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/relay/route-preload")>(
    "../../../../src/relay/route-preload"
  );

  return {
    ...actual,
    preloadRouteQuery: vi.fn()
  };
});

const preloadRouteQueryMock = vi.mocked(preloadRouteQuery);

const FEED_CANDIDATES_QUERY_TEXT =
  "query MerchantFeedCandidatesRouteQuery($first: Int, $after: String) { merchantFeedCandidates(first: $first, after: $after) { edges { node { id } } } }";

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
});

test("feedCandidatesLoader preloads the default candidate page", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/ingestion/feed-candidates");
  const descriptor = feedCandidatesQueryDescriptor({ first: 20, after: null });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    feedCandidatesLoader(buildFeedCandidatesLoaderArgs({ environment, request }))
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

test("feedCandidatesLoader preserves supported cursor and page-size params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/ingestion/feed-candidates?after=candidate-cursor&first=50"
  );
  const descriptor = feedCandidatesQueryDescriptor({
    first: 50,
    after: "candidate-cursor"
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    feedCandidatesLoader(buildFeedCandidatesLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 50,
      after: "candidate-cursor"
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 50, after: "candidate-cursor" },
    { signal: request.signal }
  );
});

test("feedCandidatesLoader drops invalid page-size params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/ingestion/feed-candidates?after=candidate-cursor&first=500"
  );
  const descriptor = feedCandidatesQueryDescriptor({
    first: 20,
    after: "candidate-cursor"
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    feedCandidatesLoader(buildFeedCandidatesLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 20,
      after: "candidate-cursor"
    },
    query: descriptor
  });
});

test("feedCandidatesLoader drops malformed page-size params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/ingestion/feed-candidates?after=candidate-cursor&first=10abc"
  );
  const descriptor = feedCandidatesQueryDescriptor({
    first: 20,
    after: "candidate-cursor"
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    feedCandidatesLoader(buildFeedCandidatesLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 20,
      after: "candidate-cursor"
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20, after: "candidate-cursor" },
    { signal: request.signal }
  );
});

test("feedCandidatesLoader trims cursor params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/ingestion/feed-candidates?after=%20candidate-cursor%20&first=%2050%20"
  );
  const descriptor = feedCandidatesQueryDescriptor({
    first: 50,
    after: "candidate-cursor"
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    feedCandidatesLoader(buildFeedCandidatesLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    pagination: {
      first: 50,
      after: "candidate-cursor"
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 50, after: "candidate-cursor" },
    { signal: request.signal }
  );
});

test("feedCandidatesLoader returns error state when route preloading fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/ingestion/feed-candidates?after=candidate-cursor&first=30"
  );
  const preloadError = new Error("Network request failed: candidates unavailable");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock.mockRejectedValue(preloadError);

  try {
    await expect(
      feedCandidatesLoader(buildFeedCandidatesLoaderArgs({ environment, request }))
    ).resolves.toEqual({
      status: "error",
      pagination: {
        first: 30,
        after: "candidate-cursor"
      }
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to preload feed candidates route query.",
      {
        error: preloadError
      }
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

function buildFeedCandidatesLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.test/ingestion/feed-candidates")
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

function feedCandidatesQueryDescriptor(variables: { first: number; after: string | null }) {
  return {
    __relayQuery: {
      operationName: "MerchantFeedCandidatesRouteQuery",
      text: FEED_CANDIDATES_QUERY_TEXT,
      variables
    }
  };
}
