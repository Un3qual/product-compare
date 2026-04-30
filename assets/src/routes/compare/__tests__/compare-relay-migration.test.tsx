import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import { createRelayEnvironment } from "../../../relay/environment";
import {
  createRelayRouterContext,
  fetchRouteQuery,
  useRoutePreloadedQuery
} from "../../../relay/route-preload";
import { CompareRoute } from "../index";
import { compareLoader } from "../loader";

const {
  commitMutationMock,
  fetchRouteQueryMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  fetchRouteQueryMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("../../../relay/fetch-graphql", () => ({
  fetchGraphQL: vi.fn()
}));

vi.mock("../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../relay/route-preload")>(
    "../../../relay/route-preload"
  );

  return {
    ...actual,
    fetchRouteQuery: fetchRouteQueryMock,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useMutation: useMutationMock,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

const mockedFetchGraphQL = vi.mocked(fetchGraphQL);
const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const DETAIL_PRODUCT = {
  id: "UHJvZHVjdDox",
  name: "Detail Product",
  slug: "detail-product",
  description: "A narrow product detail baseline.",
  brand: {
    id: "brand-1",
    name: "Acme"
  }
} as const;

const SECOND_PRODUCT = {
  id: "UHJvZHVjdDoy",
  name: "Second Product",
  slug: "second-product",
  description: "Another product for comparison.",
  brand: {
    id: "brand-2",
    name: "Bravo"
  }
} as const;

const detailProductQueryDescriptor = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: DETAIL_PRODUCT.slug }
  }
};

const secondProductQueryDescriptor = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: SECOND_PRODUCT.slug }
  }
};

const detailProductQueryRef = {
  dispose: vi.fn(),
  variables: detailProductQueryDescriptor.__relayQuery.variables
};

const secondProductQueryRef = {
  dispose: vi.fn(),
  variables: secondProductQueryDescriptor.__relayQuery.variables
};

beforeEach(() => {
  commitMutationMock.mockReset();
  fetchRouteQueryMock.mockReset();
  mockedFetchGraphQL.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  detailProductQueryRef.dispose.mockReset();
  secondProductQueryRef.dispose.mockReset();
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
});

test("compare loader preloads selected product detail queries through Relay", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );

  mockedFetchGraphQL
    .mockResolvedValueOnce({ data: { product: DETAIL_PRODUCT } })
    .mockResolvedValueOnce({ data: { product: SECOND_PRODUCT } });
  mockedFetchRouteQuery
    .mockResolvedValueOnce({
      data: {
        product: DETAIL_PRODUCT
      },
      descriptor: detailProductQueryDescriptor,
      dispose: vi.fn()
    })
    .mockResolvedValueOnce({
      data: {
        product: SECOND_PRODUCT
      },
      descriptor: secondProductQueryDescriptor,
      dispose: vi.fn()
    });

  await expect(
    compareLoader({
      request,
      params: {},
      context: createRelayRouterContext(environment)
    } as unknown as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "ready",
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
    productQueries: [detailProductQueryDescriptor, secondProductQueryDescriptor],
    products: [
      {
        id: DETAIL_PRODUCT.id,
        name: DETAIL_PRODUCT.name,
        slug: DETAIL_PRODUCT.slug,
        description: DETAIL_PRODUCT.description,
        brandName: DETAIL_PRODUCT.brand.name
      },
      {
        id: SECOND_PRODUCT.id,
        name: SECOND_PRODUCT.name,
        slug: SECOND_PRODUCT.slug,
        description: SECOND_PRODUCT.description,
        brandName: SECOND_PRODUCT.brand.name
      }
    ]
  });

  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { slug: DETAIL_PRODUCT.slug },
    { signal: request.signal }
  );
  expect(mockedFetchRouteQuery).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { slug: SECOND_PRODUCT.slug },
    { signal: request.signal }
  );
});

test("compare route renders compared product cards from Relay route queries", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockRouteQueryRefs();
  mockProductQueries();

  render(
    <MemoryRouter>
      <CompareRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Second Product" })).toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    detailProductQueryDescriptor
  );
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    secondProductQueryDescriptor
  );
});

test("compare route saves the current selection through a Relay mutation", async () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockRouteQueryRefs();
  mockProductQueries();
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted({
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1"
        },
        errors: []
      }
    });
  });

  render(
    <MemoryRouter>
      <CompareRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            name: "Detail Product vs Second Product",
            productIds: [DETAIL_PRODUCT.id, SECOND_PRODUCT.id]
          }
        }
      })
    );
  });
  expect(await screen.findByRole("status")).toHaveTextContent("Comparison saved.");
});

function buildReadyLoaderData() {
  return {
    status: "ready" as const,
    slugs: [DETAIL_PRODUCT.slug, SECOND_PRODUCT.slug],
    productQueries: [detailProductQueryDescriptor, secondProductQueryDescriptor],
    products: [
      {
        id: DETAIL_PRODUCT.id,
        name: DETAIL_PRODUCT.name,
        slug: DETAIL_PRODUCT.slug,
        description: DETAIL_PRODUCT.description,
        brandName: DETAIL_PRODUCT.brand.name
      },
      {
        id: SECOND_PRODUCT.id,
        name: SECOND_PRODUCT.name,
        slug: SECOND_PRODUCT.slug,
        description: SECOND_PRODUCT.description,
        brandName: SECOND_PRODUCT.brand.name
      }
    ]
  };
}

function mockRouteQueryRefs() {
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === detailProductQueryDescriptor) {
      return detailProductQueryRef;
    }

    if (descriptor === secondProductQueryDescriptor) {
      return secondProductQueryRef;
    }

    throw new Error(`Unexpected query descriptor: ${JSON.stringify(descriptor)}`);
  });
}

function mockProductQueries() {
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === detailProductQueryRef) {
      return {
        product: DETAIL_PRODUCT
      };
    }

    if (queryRef === secondProductQueryRef) {
      return {
        product: SECOND_PRODUCT
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });
}
