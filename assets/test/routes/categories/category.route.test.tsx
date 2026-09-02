import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router";
import { usePreloadedQuery } from "react-relay";
import { createRelayEnvironment } from "../../../src/relay/environment";
import {
  createRelayRouterContext,
  fetchRouteQuery,
  useRoutePreloadedQuery,
} from "../../../src/relay/route-preload";
import { CategoryRoute, categoryLoader } from "../../../src/routes/categories/CategoryRoute";

const {
  fetchRouteQueryMock,
  useLoaderDataMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock,
} = vi.hoisted(() => ({
  fetchRouteQueryMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn(),
}));

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload",
  );
  return {
    ...actual,
    fetchRouteQuery: fetchRouteQueryMock,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock,
  };
});
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useLoaderData: useLoaderDataMock };
});
vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return { ...actual, usePreloadedQuery: usePreloadedQueryMock };
});

const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

beforeEach(() => {
  fetchRouteQueryMock.mockReset();
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
});

test("category loader returns 404 for invalid slugs and canonical metadata for curated categories", async () => {
  const environment = createRelayEnvironment();
  mockedFetchRouteQuery.mockResolvedValueOnce({
    data: { category: null },
    descriptor: {},
    dispose: vi.fn(),
  } as never);
  const invalid = await categoryLoader({
    context: createRelayRouterContext(environment),
    params: { slug: "Bad Slug" },
    request: new Request("https://app.example/categories/Bad%20Slug"),
  } as never);
  expect((invalid as { init: { status: number } }).init.status).toBe(404);

  mockedFetchRouteQuery.mockResolvedValueOnce({
    data: {
      category: {
        seo: {
          title: "Compare Cameras",
          description: "Trusted camera details",
          canonicalPath: "/categories/cameras",
          indexable: true,
          imageUrl: null,
          structuredData: null,
        },
      },
    },
    descriptor: { descriptor: true },
    dispose: vi.fn(),
  } as never);
  const result = await categoryLoader({
    context: createRelayRouterContext(environment),
    params: { slug: "cameras" },
    request: new Request("https://app.example/categories/cameras"),
  } as never);
  expect(result).toMatchObject({
    status: "ready",
    metadata: { canonicalUrl: "https://app.example/categories/cameras", indexable: true },
  });
});

test("CategoryRoute renders curated copy, trusted inventory, and browse links", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: {
      __relayQuery: {
        cacheID: "CategoryRouteQuery-cache-id",
        operationName: "CategoryRouteQuery",
        variables: { slug: "cameras", first: 12, after: null },
      },
    },
  } as never);
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
  mockedUsePreloadedQuery.mockReturnValue({
    category: {
      id: "taxon-1",
      name: "Cameras",
      slug: "cameras",
      description: "Compare curated camera specifications with current complete offers.",
      qualifiedProductCount: 3,
      indexable: true,
      products: {
        edges: [
          {
            node: {
              id: "product-1",
              name: "Field Camera",
              slug: "field / camera?",
              description: "A camera",
              brand: { id: "brand-1", name: "Acme" },
              currentAttributes: [
                {
                  attributeId: "attribute-1",
                  displayName: "Resolution",
                  valueText: "24 MP",
                  sortOrder: 1,
                },
              ],
            },
          },
        ],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    },
  } as never);

  render(
    <MemoryRouter>
      <CategoryRoute />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: "Compare Cameras" })).toBeVisible();
  expect(screen.getByText(/3 products currently have the specifications/)).toBeVisible();
  expect(screen.getByText(/Current qualifying offers available/)).toBeVisible();
  expect(screen.queryByText(/offer evidence|offer-quality/i)).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Field Camera" })).toHaveAttribute(
    "href",
    "/products/field%20%2F%20camera%3F",
  );
  expect(screen.getByRole("link", { name: "Explore every product and filter" })).toHaveAttribute(
    "href",
    "/products?typeTaxonId=taxon-1&includeTypeDescendants=1",
  );
});

test("CategoryRoute suppresses a repeated next-page cursor", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: {
      __relayQuery: {
        cacheID: "CategoryRouteQuery-cache-id",
        operationName: "CategoryRouteQuery",
        variables: { slug: "cameras", first: 12, after: "same-cursor" },
      },
    },
  } as never);
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
  mockedUsePreloadedQuery.mockReturnValue({
    category: {
      id: "taxon-1",
      name: "Cameras",
      slug: "cameras",
      description: null,
      qualifiedProductCount: 0,
      indexable: true,
      products: {
        edges: [],
        pageInfo: { hasNextPage: true, endCursor: "same-cursor" },
      },
    },
  } as never);

  render(
    <MemoryRouter>
      <CategoryRoute />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("link", { name: "Next products" })).not.toBeInTheDocument();
});

test("CategoryRoute keeps source product and highlight order while encoding its next page", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: {
      __relayQuery: {
        cacheID: "CategoryRouteQuery-cache-id",
        operationName: "CategoryRouteQuery",
        variables: { slug: "cameras", first: 12, after: null },
      },
    },
  } as never);
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
  mockedUsePreloadedQuery.mockReturnValue({
    category: {
      id: "taxon-1",
      name: "Cameras",
      slug: "cameras / mirrorless?",
      description: null,
      qualifiedProductCount: 2,
      indexable: true,
      products: {
        edges: [
          {
            node: {
              id: "product-second",
              name: "Second product",
              slug: "second-product",
              description: null,
              brand: null,
              currentAttributes: [],
            },
          },
          {
            node: {
              id: "product-first",
              name: "First product",
              slug: "first-product",
              description: null,
              brand: { id: "brand-1", name: "Acme" },
              currentAttributes: [
                { attributeId: "fourth", displayName: "Fourth", valueText: "4", sortOrder: 4 },
                { attributeId: "second", displayName: "Second", valueText: "2", sortOrder: 2 },
                { attributeId: "fifth", displayName: "Fifth", valueText: "5", sortOrder: 5 },
                { attributeId: "first", displayName: "First", valueText: "1", sortOrder: 1 },
              ],
            },
          },
        ],
        pageInfo: { hasNextPage: true, endCursor: "cursor + /?" },
      },
    },
  } as never);

  render(
    <MemoryRouter>
      <CategoryRoute />
    </MemoryRouter>,
  );

  expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
    "Second product",
    "First product",
  ]);
  expect(screen.getByText("Unknown brand · Current qualifying offers available")).toBeVisible();
  expect(
    screen
      .getByRole("list", { name: "First product specification highlights" })
      .querySelectorAll("li"),
  ).toHaveLength(3);
  expect(screen.getByText("Fourth:").parentElement?.textContent).toBe("Fourth: 4");
  expect(screen.getByText("Second:").parentElement?.textContent).toBe("Second: 2");
  expect(screen.getByText("Fifth:").parentElement?.textContent).toBe("Fifth: 5");
  expect(screen.getByRole("link", { name: "Next products" })).toHaveAttribute(
    "href",
    "/categories/cameras%20%2F%20mirrorless%3F?after=cursor%20%2B%20%2F%3F",
  );
});

test("CategoryRoute renders its empty result state", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    query: {
      __relayQuery: {
        cacheID: "CategoryRouteQuery-cache-id",
        operationName: "CategoryRouteQuery",
        variables: { slug: "cameras", first: 12, after: null },
      },
    },
  } as never);
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
  mockedUsePreloadedQuery.mockReturnValue({
    category: {
      id: "taxon-1",
      name: "Cameras",
      slug: "cameras",
      description: null,
      qualifiedProductCount: 0,
      indexable: true,
      products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } },
    },
  } as never);

  render(
    <MemoryRouter>
      <CategoryRoute />
    </MemoryRouter>,
  );

  expect(screen.getByText("No qualifying products are available yet.")).toBeVisible();
});
