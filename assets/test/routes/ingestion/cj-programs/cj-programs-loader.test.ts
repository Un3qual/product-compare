import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../../../src/relay/environment";
import {
  createRelayRouterContext,
  preloadRouteQuery
} from "../../../../src/relay/route-preload";
import { cjProgramsLoader } from "../../../../src/routes/ingestion/cj-programs/loader";
import type { CJProgramsRouteQuery } from "../../../../src/__generated__/CJProgramsRouteQuery.graphql";

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

const CJ_PROGRAMS_QUERY_TEXT =
  "query CJProgramsRouteQuery($first: Int!, $after: String, $stage: CJProgramStage, $sort: CJProgramSort!, $unmatchedFirst: Int!, $unmatchedAfter: String) { cjProgramStageCounts { new } cjPrograms(first: $first, after: $after, stage: $stage, sort: $sort) { edges { node { id } } } unmatchedCjFeeds(first: $unmatchedFirst, after: $unmatchedAfter) { edges { node { id } } } }";

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
});

test("cjProgramsLoader preloads counts and both default connections in one operation", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/ingestion/cj-programs");
  const variables = {
    first: 20,
    after: null,
    stage: null,
    sort: "NAME_ASC" as const,
    unmatchedFirst: 10,
    unmatchedAfter: null
  };
  const descriptor = cjProgramsQueryDescriptor(variables);

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    cjProgramsLoader(buildCJProgramsLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    pagination: variables,
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledTimes(1);
  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    variables,
    { signal: request.signal }
  );
});

test("cjProgramsLoader preserves each normalized connection cursor and page size", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/ingestion/cj-programs?first=30&after=program-cursor&stage=selected&sort=last_changed_desc&unmatchedFirst=7&unmatchedAfter=unmatched-cursor"
  );
  const variables = {
    first: 30,
    after: "program-cursor",
    stage: "SELECTED" as const,
    sort: "LAST_CHANGED_DESC" as const,
    unmatchedFirst: 7,
    unmatchedAfter: "unmatched-cursor"
  };
  const descriptor = cjProgramsQueryDescriptor(variables);

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    cjProgramsLoader(buildCJProgramsLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    pagination: variables,
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledTimes(1);
  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    variables,
    { signal: request.signal }
  );
});

test("cjProgramsLoader returns the existing error shape for unavailable data", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/ingestion/cj-programs?first=30&after=program-cursor"
  );
  const preloadError = new Error("Network request failed: CJ programs unavailable");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock.mockRejectedValue(preloadError);

  try {
    await expect(
      cjProgramsLoader(buildCJProgramsLoaderArgs({ environment, request }))
    ).resolves.toEqual({
      status: "error",
      pagination: {
        first: 30,
        after: "program-cursor",
        stage: null,
        sort: "NAME_ASC",
        unmatchedFirst: 10,
        unmatchedAfter: null
      }
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to preload CJ programs route query.",
      { error: preloadError }
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("cjProgramsLoader forwards and rethrows request aborts", async () => {
  const environment = createRelayEnvironment();
  const controller = new AbortController();
  const request = new Request("https://app.example.test/ingestion/cj-programs", {
    signal: controller.signal
  });
  const abortError = new DOMException("Route transition", "AbortError");

  preloadRouteQueryMock.mockRejectedValue(abortError);

  await expect(
    cjProgramsLoader(buildCJProgramsLoaderArgs({ environment, request }))
  ).rejects.toBe(abortError);

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      first: 20,
      after: null,
      stage: null,
      sort: "NAME_ASC",
      unmatchedFirst: 10,
      unmatchedAfter: null
    },
    { signal: request.signal }
  );
});

function buildCJProgramsLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.test/ingestion/cj-programs")
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

function cjProgramsQueryDescriptor(variables: CJProgramsRouteQuery["variables"]) {
  return {
    __relayQuery: {
      operationName: "CJProgramsRouteQuery",
      text: CJ_PROGRAMS_QUERY_TEXT,
      variables
    }
  };
}
