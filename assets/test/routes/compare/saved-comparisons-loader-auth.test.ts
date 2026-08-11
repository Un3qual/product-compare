import { fetchRouteQuery } from "../../../src/relay/route-preload";
import {
  isUnauthorizedSavedComparisonsResponse,
  savedComparisonsLoader,
} from "../../../src/routes/compare/SavedComparisonsRoute";
import {
  buildGraphQLResponseWithErrors,
  buildRouteLoaderGraphQLError,
  buildSavedComparisonsLoaderArgs,
} from "./saved-comparisons-test-helpers";

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload",
  );

  return {
    ...actual,
    fetchRouteQuery: vi.fn(),
  };
});

const fetchRouteQueryMock = vi.mocked(fetchRouteQuery);

beforeEach(() => {
  fetchRouteQueryMock.mockReset();
});

test("isUnauthorizedSavedComparisonsResponse detects a pathless unauthenticated response", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      buildGraphQLResponseWithErrors([
        {
          message: "Unauthorized",
          extensions: {
            code: "UNAUTHENTICATED",
          },
        },
      ]),
    ),
  ).toBe(true);
});

test("savedComparisonsLoader returns unauthorized for a pathless structured auth response", async () => {
  fetchRouteQueryMock.mockRejectedValueOnce(
    buildRouteLoaderGraphQLError([
      {
        message: "Authentication failed",
        extensions: {
          code: "UNAUTHENTICATED",
        },
      },
    ]),
  );

  await expect(savedComparisonsLoader(buildSavedComparisonsLoaderArgs())).resolves.toEqual({
    status: "unauthorized",
  });
});

test("savedComparisonsLoader does not treat generic access denied failures as auth state", async () => {
  fetchRouteQueryMock.mockRejectedValueOnce(
    new Error("CDN access denied while fetching saved comparison sets"),
  );

  await expect(savedComparisonsLoader(buildSavedComparisonsLoaderArgs())).rejects.toThrow(
    "CDN access denied while fetching saved comparison sets",
  );
});

test("isUnauthorizedSavedComparisonsResponse ignores legacy unauthorized extension codes", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      buildGraphQLResponseWithErrors([
        {
          message: "Unauthorized",
          path: ["mySavedComparisonSets"],
          extensions: {
            code: "UNAUTHORIZED",
          },
        },
      ]),
    ),
  ).toBe(false);
});

test("savedComparisonsLoader preserves the URL cursor in its Relay descriptor", async () => {
  const request = new Request("https://app.example.test/compare/saved?after=cursor-1");
  const descriptor = {
    __relayQuery: {
      operationName: "SavedComparisonsRouteQuery",
      text: "query SavedComparisonsRouteQuery { mySavedComparisonSets { pageInfo { hasNextPage } } }",
      variables: { first: 20, after: "cursor-1" },
    },
  };
  fetchRouteQueryMock.mockResolvedValueOnce({
    data: {
      mySavedComparisonSets: { pageInfo: { endCursor: "cursor-2", hasNextPage: true } },
    },
    descriptor,
    dispose: vi.fn(),
  });

  await expect(
    savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ request })),
  ).resolves.toEqual({ status: "ready", after: "cursor-1", query: descriptor });
  expect(fetchRouteQueryMock).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    { first: 20, after: "cursor-1" },
    { signal: request.signal },
  );
});

test("savedComparisonsLoader does not fetch an already-aborted request", async () => {
  const controller = new AbortController();
  const abortError = new Error("navigation aborted");
  controller.abort(abortError);
  const request = new Request("https://app.example.test/compare/saved", {
    signal: controller.signal,
  });

  await expect(savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ request }))).rejects.toBe(
    abortError,
  );
  expect(fetchRouteQueryMock).not.toHaveBeenCalled();
});

test("savedComparisonsLoader disposes a page when navigation aborts after the fetch", async () => {
  const controller = new AbortController();
  const abortError = new Error("navigation aborted");
  const dispose = vi.fn();
  const request = new Request("https://app.example.test/compare/saved", {
    signal: controller.signal,
  });
  fetchRouteQueryMock.mockImplementationOnce(async () => {
    controller.abort(abortError);
    return {
      data: {
        mySavedComparisonSets: { pageInfo: { endCursor: null, hasNextPage: false } },
      },
      descriptor: {
        __relayQuery: {
          operationName: "SavedComparisonsRouteQuery",
          text: null,
          variables: { first: 20 },
        },
      },
      dispose,
    };
  });

  await expect(savedComparisonsLoader(buildSavedComparisonsLoaderArgs({ request }))).rejects.toBe(
    abortError,
  );
  expect(dispose).toHaveBeenCalledTimes(1);
});
