import type { LoaderFunctionArgs } from "react-router-dom";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import { createRelayEnvironment } from "../../../relay/environment";
import {
  createRelayRouterContext,
  fetchRouteQuery
} from "../../../relay/route-preload";
import {
  isUnauthorizedSavedComparisonsResponse,
  savedComparisonsLoader
} from "../saved-data";

vi.mock("../../../relay/fetch-graphql", () => ({
  fetchGraphQL: vi.fn()
}));

vi.mock("../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../relay/route-preload")>(
    "../../../relay/route-preload"
  );

  return {
    ...actual,
    fetchRouteQuery: vi.fn()
  };
});

const fetchGraphQLMock = vi.mocked(fetchGraphQL);
const fetchRouteQueryMock = vi.mocked(fetchRouteQuery);

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  fetchRouteQueryMock.mockReset();
});

test("isUnauthorizedSavedComparisonsResponse detects a pathless unauthenticated response", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      {
        errors: [
          {
            message: "Unauthorized",
            extensions: {
              code: "UNAUTHENTICATED"
            }
          }
        ]
      } as unknown as Parameters<typeof isUnauthorizedSavedComparisonsResponse>[0]
    )
  ).toBe(true);
});

test("savedComparisonsLoader returns unauthorized for a pathless not authorized response", async () => {
  fetchRouteQueryMock.mockRejectedValueOnce(
    new Error("GraphQL response contained errors: You are not authorized to access saved comparison sets")
  );

  await expect(
    savedComparisonsLoader({
      request: new Request("https://app.example.com/compare/saved"),
      params: {},
      context: createRelayRouterContext(createRelayEnvironment())
    } as unknown as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "unauthorized",
    savedSetQueries: [],
    savedSets: []
  });
});
