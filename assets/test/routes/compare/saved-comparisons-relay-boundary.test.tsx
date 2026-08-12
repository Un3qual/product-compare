import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { RelayEnvironmentProvider } from "react-relay";
import { createOperationDescriptor, getRequest, type PayloadData } from "relay-runtime";
import savedComparisonsRouteQueryArtifact, {
  type SavedComparisonsRouteQuery,
} from "../../../src/__generated__/SavedComparisonsRouteQuery.graphql";
import { createRelayEnvironment } from "../../../src/relay/environment";
import { SavedComparisonsRoute } from "../../../src/routes/compare/SavedComparisonsRoute";

const { useLoaderDataMock } = vi.hoisted(() => ({ useLoaderDataMock: vi.fn() }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useLoaderData: useLoaderDataMock };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);

beforeEach(() => {
  mockedUseLoaderData.mockReset();
});

test("saved comparisons operation delegates saved-set fields to the masked list fragment", () => {
  const operation = getRequest(savedComparisonsRouteQueryArtifact);
  const connection = operation.fragment.selections.find(
    (selection) => selection.kind === "LinkedField" && selection.name === "mySavedComparisonSets",
  );

  expect(connection).toMatchObject({
    kind: "LinkedField",
    selections: expect.arrayContaining([
      expect.objectContaining({ kind: "FragmentSpread", name: "SavedComparisonSetList_savedSets" }),
    ]),
  });
});

test("saved comparisons renders the Relay page instead of an unmasked loader projection", () => {
  const environment = createRelayEnvironment();
  const variables: SavedComparisonsRouteQuery["variables"] = { first: 20 };
  environment.commitPayload(
    createOperationDescriptor(getRequest(savedComparisonsRouteQueryArtifact), variables),
    savedComparisonsResponse("Relay saved set", "relay-product"),
  );
  const descriptor = {
    __relayQuery: {
      operationName: savedComparisonsRouteQueryArtifact.params.name,
      text: savedComparisonsRouteQueryArtifact.params.text,
      variables,
    },
  };

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: descriptor,
    savedSetQueries: [descriptor],
    savedSets: [
      {
        id: "loader-leak",
        name: "Loader projection leak",
        products: [{ name: "Loader product", slug: "loader-product" }],
      },
    ],
  });

  render(
    <RelayEnvironmentProvider environment={environment}>
      <MemoryRouter>
        <SavedComparisonsRoute />
      </MemoryRouter>
    </RelayEnvironmentProvider>,
  );

  expect(screen.getByRole("heading", { name: "Relay saved set" })).toBeVisible();
  expect(screen.getByText("Relay product")).toBeVisible();
  expect(screen.queryByText("Loader projection leak")).not.toBeInTheDocument();
});

function savedComparisonsResponse(
  name: string,
  slug: string,
): PayloadData {
  return {
    mySavedComparisonSets: {
      edges: [
        {
          node: {
            id: "saved-set-1",
            name,
            items: [{ position: 1, product: { id: "product-1", name: "Relay product", slug } }],
          },
        },
      ],
      pageInfo: { endCursor: null, hasNextPage: false },
    },
  };
}
