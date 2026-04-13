import type { LoaderFunctionArgs } from "react-router-dom";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import {
  isUnauthorizedSavedComparisonsResponse,
  savedComparisonsLoader
} from "../api";

vi.mock("../../../relay/fetch-graphql", () => ({
  fetchGraphQL: vi.fn()
}));

const fetchGraphQLMock = vi.mocked(fetchGraphQL);

beforeEach(() => {
  fetchGraphQLMock.mockReset();
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
  fetchGraphQLMock.mockResolvedValue({
    errors: [
      {
        message: "You are not authorized to access saved comparison sets"
      }
    ]
  });

  await expect(
    savedComparisonsLoader({
      request: new Request("https://app.example.com/compare/saved"),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "unauthorized",
    savedSets: []
  });
});
