import { createRelayEnvironment } from "../../../../src/relay/environment";
import { createRelayRouterContext, preloadRouteQuery } from "../../../../src/relay/route-preload";
import { cjProgramsLoader } from "../../../../src/routes/ingestion/cj-programs/CJProgramsRoute";
import type { CJProgramsRouteQuery } from "../../../../src/__generated__/CJProgramsRouteQuery.graphql";
import type { UnmatchedFeedsQuery } from "../../../../src/__generated__/UnmatchedFeedsQuery.graphql";
import { buildAbortableRequest } from "../../compare/saved-comparisons-test-helpers";

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

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
});

test("cjProgramsLoader preloads the default lifecycle ledger and unmatched feeds independently", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/ingestion/cj-programs");
  const variables = {
    first: 20,
    after: null,
    stage: null,
    sort: "NAME_ASC" as const,
    unmatchedFirst: 10,
    unmatchedAfter: null,
  };
  const descriptor = cjProgramsQueryDescriptor({
    first: variables.first,
    after: variables.after,
    stage: variables.stage,
    sort: variables.sort,
  });
  const unmatchedDescriptor = unmatchedFeedsQueryDescriptor({
    first: variables.unmatchedFirst,
    after: variables.unmatchedAfter,
  });

  preloadRouteQueryMock
    .mockResolvedValueOnce(descriptor)
    .mockResolvedValueOnce(unmatchedDescriptor);

  const result = await cjProgramsLoader(buildCJProgramsLoaderArgs({ environment, request }));

  expect(result).toMatchObject({ status: "ready", pagination: variables, query: descriptor });
  await expect((result as { unmatchedQuery: Promise<unknown> }).unmatchedQuery).resolves.toBe(
    unmatchedDescriptor,
  );
  expect(preloadRouteQueryMock).toHaveBeenCalledTimes(2);
  expect(preloadRouteQueryMock).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { first: 20, after: null, stage: null, sort: "NAME_ASC" },
    { signal: request.signal },
  );
  expect(preloadRouteQueryMock).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { first: 10, after: null },
    { signal: request.signal },
  );
});

test("cjProgramsLoader isolates an unmatched-feed preload failure from program data", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/ingestion/cj-programs");
  const descriptor = cjProgramsQueryDescriptor({
    first: 20,
    after: null,
    stage: null,
    sort: "NAME_ASC",
  });
  const unmatchedError = new Error("unmatched feeds unavailable");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock.mockResolvedValueOnce(descriptor).mockRejectedValueOnce(unmatchedError);

  try {
    const result = await cjProgramsLoader(buildCJProgramsLoaderArgs({ environment, request }));

    expect(result).toMatchObject({
      status: "ready",
      query: descriptor,
    });
    await expect(
      (result as { unmatchedQuery: Promise<unknown> }).unmatchedQuery,
    ).resolves.toBeNull();
    expect(preloadRouteQueryMock).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload unmatched CJ feeds query.", {
      error: unmatchedError,
    });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("cjProgramsLoader preserves each normalized connection cursor and page size", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/ingestion/cj-programs?first=30&after=program-cursor&stage=selected&sort=last_changed_desc&unmatchedFirst=7&unmatchedAfter=unmatched-cursor",
  );
  const variables = {
    first: 30,
    after: "program-cursor",
    stage: "SELECTED" as const,
    sort: "LAST_CHANGED_DESC" as const,
    unmatchedFirst: 7,
    unmatchedAfter: "unmatched-cursor",
  };
  const descriptor = cjProgramsQueryDescriptor({
    first: variables.first,
    after: variables.after,
    stage: variables.stage,
    sort: variables.sort,
  });
  const unmatchedDescriptor = unmatchedFeedsQueryDescriptor({
    first: variables.unmatchedFirst,
    after: variables.unmatchedAfter,
  });

  preloadRouteQueryMock
    .mockResolvedValueOnce(descriptor)
    .mockResolvedValueOnce(unmatchedDescriptor);

  const result = await cjProgramsLoader(buildCJProgramsLoaderArgs({ environment, request }));

  expect(result).toMatchObject({ status: "ready", pagination: variables, query: descriptor });
  await expect((result as { unmatchedQuery: Promise<unknown> }).unmatchedQuery).resolves.toBe(
    unmatchedDescriptor,
  );
  expect(preloadRouteQueryMock).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    {
      first: 30,
      after: "program-cursor",
      stage: "SELECTED",
      sort: "LAST_CHANGED_DESC",
    },
    { signal: request.signal },
  );
  expect(preloadRouteQueryMock).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { first: 7, after: "unmatched-cursor" },
    { signal: request.signal },
  );
});

test("cjProgramsLoader preserves unmatched feeds when program data is unavailable", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/ingestion/cj-programs?first=30&after=program-cursor",
  );
  const preloadError = new Error("Network request failed: CJ programs unavailable");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock
    .mockRejectedValueOnce(preloadError)
    .mockResolvedValueOnce(unmatchedFeedsQueryDescriptor({ first: 10, after: null }));

  try {
    const result = await cjProgramsLoader(buildCJProgramsLoaderArgs({ environment, request }));

    expect(result).toMatchObject({
      status: "error",
      pagination: {
        first: 30,
        after: "program-cursor",
        stage: null,
        sort: "NAME_ASC",
        unmatchedFirst: 10,
        unmatchedAfter: null,
      },
    });
    await expect((result as { unmatchedQuery: Promise<unknown> }).unmatchedQuery).resolves.toEqual(
      unmatchedFeedsQueryDescriptor({ first: 10, after: null }),
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload CJ programs route query.", {
      error: preloadError,
    });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("cjProgramsLoader forwards and rethrows request aborts", async () => {
  const environment = createRelayEnvironment();
  const controller = new AbortController();
  const request = buildAbortableRequest(
    "https://app.example.test/ingestion/cj-programs",
    controller.signal,
  );
  const abortError = new DOMException("Route transition", "AbortError");

  preloadRouteQueryMock
    .mockRejectedValueOnce(abortError)
    .mockResolvedValueOnce(unmatchedFeedsQueryDescriptor({ first: 10, after: null }));

  await expect(cjProgramsLoader(buildCJProgramsLoaderArgs({ environment, request }))).rejects.toBe(
    abortError,
  );

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20, after: null, stage: null, sort: "NAME_ASC" },
    { signal: request.signal },
  );
});

test("cjProgramsLoader drains the detached unmatched-feed preload when the request aborts", async () => {
  const environment = createRelayEnvironment();
  const controller = new AbortController();
  const request = buildAbortableRequest(
    "https://app.example.test/ingestion/cj-programs",
    controller.signal,
  );
  const abortError = new DOMException("Route transition", "AbortError");
  const programsPreload = deferredPromise<ReturnType<typeof cjProgramsQueryDescriptor>>();
  const unmatchedPreload = deferredPromise<ReturnType<typeof unmatchedFeedsQueryDescriptor>>();
  const unhandledRejections: unknown[] = [];
  const captureUnhandledRejection = (reason: unknown) => {
    unhandledRejections.push(reason);
  };

  preloadRouteQueryMock
    .mockImplementationOnce(() => programsPreload.promise)
    .mockImplementationOnce(() => unmatchedPreload.promise);
  process.on("unhandledRejection", captureUnhandledRejection);

  try {
    const loaderResult = cjProgramsLoader(buildCJProgramsLoaderArgs({ environment, request }));

    controller.abort(abortError);
    programsPreload.reject(abortError);
    await expect(loaderResult).rejects.toBe(abortError);

    unmatchedPreload.reject(abortError);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(unhandledRejections).toEqual([]);
  } finally {
    process.off("unhandledRejection", captureUnhandledRejection);
  }
});

function buildCJProgramsLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.test/ingestion/cj-programs"),
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}) {
  return {
    request,
    params: {},
    context: createRelayRouterContext(environment),
    pattern: "/ingestion/cj-programs",
    url: new URL(request.url),
  };
}

function cjProgramsQueryDescriptor(variables: CJProgramsRouteQuery["variables"]) {
  return {
    __relayQuery: {
      cacheID: "CJProgramsRouteQuery-cache-id",
      operationName: "CJProgramsRouteQuery",
      variables,
    },
  };
}

function unmatchedFeedsQueryDescriptor(variables: UnmatchedFeedsQuery["variables"]) {
  return {
    __relayQuery: {
      cacheID: "UnmatchedFeedsQuery-cache-id",
      operationName: "UnmatchedFeedsQuery",
      variables,
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
