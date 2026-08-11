import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RelayEnvironmentProvider } from "react-relay";
import { createOperationDescriptor, getRequest, type PayloadData } from "relay-runtime";
import browseRouteQueryArtifact, {
  type BrowseRouteQuery,
} from "../../src/__generated__/BrowseRouteQuery.graphql";
import homeRouteQueryArtifact, {
  type HomeRouteQuery,
} from "../../src/__generated__/HomeRouteQuery.graphql";
import { createRelayEnvironment } from "../../src/relay/environment";
import { BrowseRoute } from "../../src/routes/catalog/BrowseRoute";
import { HomeRoute } from "../../src/routes/home/HomeRoute";

const { useLoaderDataMock } = vi.hoisted(() => ({ useLoaderDataMock: vi.fn() }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useLoaderData: useLoaderDataMock };
});

vi.mock("../../src/routes/home/HomeDeals", () => ({ HomeDeals: () => null }));

beforeEach(() => {
  useLoaderDataMock.mockReset();
});

test("home route passes a real masked product-connection key to HomeProductLedger", () => {
  const environment = createRelayEnvironment();
  const variables: HomeRouteQuery["variables"] = { first: 12, selectedSlugs: [] };
  environment.commitPayload(
    createOperationDescriptor(getRequest(homeRouteQueryArtifact), variables),
    homeResponse(),
  );
  const descriptor = routeDescriptor(homeRouteQueryArtifact, variables);
  useLoaderDataMock.mockReturnValue({ selectedSlugs: [], workspace: descriptor });

  render(
    <RelayEnvironmentProvider environment={environment}>
      <MemoryRouter>
        <HomeRoute />
      </MemoryRouter>
    </RelayEnvironmentProvider>,
  );

  expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute(
    "href",
    "/products/relay-camera",
  );
  expect(screen.getAllByText("Resolution: 24 MP").length).toBeGreaterThan(0);
  expect(screen.getAllByText("$99.00 at Relay Shop").length).toBeGreaterThan(0);
});

test("browse route passes real masked connection and item keys through both list fragments", () => {
  const environment = createRelayEnvironment();
  const variables: BrowseRouteQuery["variables"] = { first: 12 };
  environment.commitPayload(
    createOperationDescriptor(getRequest(browseRouteQueryArtifact), variables),
    browseResponse(),
  );
  const descriptor = routeDescriptor(browseRouteQueryArtifact, variables);
  useLoaderDataMock.mockReturnValue({
    status: "ready",
    filters: { useCaseTaxonIds: [], numeric: [], booleans: [], enums: [] },
    pageSize: 12,
    query: descriptor,
  });

  render(
    <RelayEnvironmentProvider environment={environment}>
      <MemoryRouter initialEntries={["/products"]}>
        <BrowseRoute />
      </MemoryRouter>
    </RelayEnvironmentProvider>,
  );

  expect(screen.getByRole("article", { name: "Relay Camera" })).toBeVisible();
  expect(screen.getByText("Relay Brand")).toBeVisible();
  expect(screen.getByRole("list", { name: "Specification highlights" })).toHaveTextContent(
    "Resolution: 24 MP",
  );
  expect(screen.getByRole("link", { name: "View details for Relay Camera" })).toHaveAttribute(
    "href",
    "/products/relay-camera",
  );
});

function homeResponse(): PayloadData {
  return {
    homeWorkspace: {
      categories: { edges: [] },
      selectedProducts: [],
      products: {
        edges: [
          {
            cursor: "home-cursor-1",
            node: { id: "product-1", name: "Relay Camera", slug: "relay-camera" },
            highlights: [{ label: "Resolution", value: "24 MP" }],
            offer: {
              merchantName: "Relay Shop",
              currency: "USD",
              landedPrice: "99.00",
              priceSignal: "LOWEST",
              observedAt: "2026-08-10T12:00:00Z",
            },
          },
        ],
      },
    },
  };
}

function browseResponse(): PayloadData {
  return {
    products: {
      edges: [
        {
          cursor: "browse-cursor-1",
          node: {
            id: "product-1",
            name: "Relay Camera",
            slug: "relay-camera",
            brand: { id: "brand-1", name: "Relay Brand" },
            currentAttributes: [
              {
                code: "resolution",
                displayName: "Resolution",
                valueText: "24 MP",
                sortOrder: 1,
              },
            ],
          },
        },
      ],
      pageInfo: { endCursor: null, hasNextPage: false },
    },
    productFilterMetadata: {
      resultCount: 1,
      typeOptions: [],
      useCaseOptions: [],
      numericFilters: [],
      booleanFilters: [],
      enumFilters: [],
    },
  };
}

function routeDescriptor<TVariables>(
  query: { params: { name: string; text: string | null } },
  variables: TVariables,
) {
  return {
    __relayQuery: { operationName: query.params.name, text: query.params.text, variables },
  };
}
