import { fetchRouteQuery } from "../../../src/relay/route-preload";
import {
  isUnauthorizedSavedComparisonsResponse,
  savedComparisonsLoader,
} from "../../../src/routes/compare/saved-data";
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
    savedSetQueries: [],
    savedSets: [],
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
