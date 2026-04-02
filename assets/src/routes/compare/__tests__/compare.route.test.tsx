import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import type { LoaderFunctionArgs } from "react-router-dom";
import {
  MemoryRouter,
  useLoaderData
} from "react-router-dom";
import * as ReactRouterDom from "react-router-dom";
import { compareLoader, isUnauthorizedSavedComparisonsResponse, savedComparisonsLoader } from "../api";
import { CompareErrorBoundary } from "../error-boundary";
import { CompareRoute } from "../index";
import { SavedComparisonsRoute } from "../saved";

const { useLoaderDataMock } = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn()
}));

vi.mock("../../../relay/fetch-graphql", () => ({
  fetchGraphQL: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

const fetchGraphQLMock = vi.mocked(fetchGraphQL);
const mockedUseLoaderData = vi.mocked(useLoaderData);
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

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    resolve,
    reject
  };
};

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  useLoaderDataMock.mockReset();
});

const buildProductDetailResponse = (product: typeof DETAIL_PRODUCT | typeof SECOND_PRODUCT) => {
  return {
    data: {
      product: {
        ...product
      }
    }
  };
};

test("compare loader returns an empty state when no slugs are selected", async () => {
  await expect(
    compareLoader({
      request: new Request("https://app.example.com/compare"),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "empty",
    slugs: []
  });
});

test("compare loader rejects more than three selected slugs", async () => {
  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=one&slug=two&slug=three&slug=four"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "too_many",
    slugs: ["one", "two", "three", "four"]
  });
});

test("compare loader requests selected product details and preserves URL order", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce(buildProductDetailResponse(DETAIL_PRODUCT))
    .mockResolvedValueOnce(buildProductDetailResponse(SECOND_PRODUCT));

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=detail-product&slug=second-product"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "ready",
    slugs: ["detail-product", "second-product"],
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

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("query ProductDetail"),
    { slug: "detail-product" },
    undefined
  );
  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining("query ProductDetail"),
    { slug: "second-product" },
    undefined
  );
});

test("compare loader forwards the request when running in server mode", async () => {
  const request = new Request(
    "https://app.example.com/compare?slug=detail-product&slug=second-product"
  );
  const originalWindow = globalThis.window;

  vi.stubGlobal("window", undefined);
  fetchGraphQLMock
    .mockResolvedValueOnce(buildProductDetailResponse(DETAIL_PRODUCT))
    .mockResolvedValueOnce(buildProductDetailResponse(SECOND_PRODUCT));

  try {
    await expect(
      compareLoader({
        request,
        params: {},
        context: undefined
      } as LoaderFunctionArgs)
    ).resolves.toEqual({
      status: "ready",
      slugs: ["detail-product", "second-product"],
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
  } finally {
    vi.stubGlobal("window", originalWindow);
  }

  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("query ProductDetail"),
    { slug: "detail-product" },
    { request, signal: request.signal }
  );
  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining("query ProductDetail"),
    { slug: "second-product" },
    { request, signal: request.signal }
  );
});

test("compare loader returns not_found when any selected product is missing", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce(buildProductDetailResponse(DETAIL_PRODUCT))
    .mockResolvedValueOnce({
      data: {
        product: null
      }
    });

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=detail-product&slug=missing-product"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "not_found",
    slugs: ["detail-product", "missing-product"]
  });
});

test("compare loader throws when any selected product request fails", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce(buildProductDetailResponse(DETAIL_PRODUCT))
    .mockRejectedValueOnce(new Error("Network request failed: boom"));

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=detail-product&slug=broken-product"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).rejects.toThrow("Network request failed: boom");
});

test("compare loader throws when a rejected request is mixed with a missing product", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        product: null
      }
    })
    .mockRejectedValueOnce(new Error("Network request failed: boom"));

  await expect(
    compareLoader({
      request: new Request(
        "https://app.example.com/compare?slug=missing-product&slug=broken-product"
      ),
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).rejects.toThrow("Network request failed: boom");
});

test("renders an empty-state message when no products are selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    slugs: []
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("Choose up to 3 products to compare.")).toBeInTheDocument();
});

test("renders a limit message when more than three products are selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "too_many",
    slugs: ["one", "two", "three", "four"]
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("You can compare up to 3 products.")).toBeInTheDocument();
});

test("renders compared product cards returned by the route loader", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    slugs: ["detail-product", "second-product"],
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

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Second Product" })).toBeInTheDocument();
});

test("compare route renders the compare error boundary when the loader throws", async () => {
  const useRouteErrorSpy = vi
    .spyOn(ReactRouterDom, "useRouteError")
    .mockReturnValue(new Error("Network request failed: boom"));

  try {
    render(<CompareErrorBoundary />);

    expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "A network error occurred while loading the comparison."
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please check your internet connection and try again."
    );
  } finally {
    useRouteErrorSpy.mockRestore();
  }
});

test("compare route keeps non-network TypeErrors on the generic error path", () => {
  const useRouteErrorSpy = vi
    .spyOn(ReactRouterDom, "useRouteError")
    .mockReturnValue(new TypeError("Cannot read properties of undefined"));

  try {
    render(<CompareErrorBoundary title="Compare products" />);

    expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "An unexpected error occurred while loading the comparison."
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(
      "Please check your internet connection and try again."
    );
  } finally {
    useRouteErrorSpy.mockRestore();
  }
});

test("compare route saves the current ready-state selection", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1",
          name: "Detail Product vs Second Product",
          items: []
        },
        errors: []
      }
    }
  });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    slugs: ["detail-product", "second-product"],
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

  render(<CompareRoute />);

  fireEvent.click(screen.getByRole("button", { name: /save comparison/i }));

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation CreateSavedComparisonSet"),
      {
        input: {
          name: "Detail Product vs Second Product",
          productIds: [DETAIL_PRODUCT.id, SECOND_PRODUCT.id]
        }
      }
    );
  });

  expect(await screen.findByRole("status")).toHaveTextContent("Comparison saved.");
});

test("renders a not-found message when any selected product is missing", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "not_found",
    slugs: ["detail-product", "missing-product"]
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
  expect(screen.getByText("One or more selected products were not found.")).toBeInTheDocument();
});

test("saved comparisons loader requests the current user's sets and forwards the SSR request", async () => {
  const request = new Request("https://app.example.com/compare/saved");
  const originalWindow = globalThis.window;

  vi.stubGlobal("window", undefined);
  fetchGraphQLMock.mockResolvedValue({
    data: {
      mySavedComparisonSets: {
        edges: [
          {
            node: {
              id: "saved-set-1",
              name: "Desk setup",
              items: [
                {
                  position: 2,
                  product: {
                    id: DETAIL_PRODUCT.id,
                    slug: DETAIL_PRODUCT.slug,
                    name: DETAIL_PRODUCT.name
                  }
                },
                {
                  position: 1,
                  product: {
                    id: SECOND_PRODUCT.id,
                    slug: SECOND_PRODUCT.slug,
                    name: SECOND_PRODUCT.name
                  }
                }
              ]
            }
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    }
  });

  try {
    await expect(
      savedComparisonsLoader({
        request,
        params: {},
        context: undefined
      } as LoaderFunctionArgs)
    ).resolves.toEqual({
      status: "ready",
      savedSets: [
        {
          id: "saved-set-1",
          name: "Desk setup",
          slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
        }
      ]
    });
  } finally {
    vi.stubGlobal("window", originalWindow);
  }

  expect(fetchGraphQLMock).toHaveBeenCalledWith(
    expect.stringContaining("query MySavedComparisonSets"),
    { first: 20 },
    { request, signal: request.signal }
  );
});

test("saved comparisons loader follows pagination cursors until all saved sets are loaded", async () => {
  const request = new Request("https://app.example.com/compare/saved");

  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: "saved-set-1",
                name: "Desk setup",
                items: [
                  {
                    position: 1,
                    product: {
                      id: DETAIL_PRODUCT.id,
                      slug: DETAIL_PRODUCT.slug,
                      name: DETAIL_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: "cursor-1"
          }
        }
      }
    })
    .mockResolvedValueOnce({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: "saved-set-2",
                name: "Office setup",
                items: [
                  {
                    position: 1,
                    product: {
                      id: SECOND_PRODUCT.id,
                      slug: SECOND_PRODUCT.slug,
                      name: SECOND_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: "cursor-2"
          }
        }
      }
    });

  await expect(
    savedComparisonsLoader({
      request,
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).resolves.toEqual({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [DETAIL_PRODUCT.slug]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: [SECOND_PRODUCT.slug]
      }
    ]
  });

  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("query MySavedComparisonSets"),
    { first: 20 },
    undefined
  );
  expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining("query MySavedComparisonSets"),
    { first: 20, after: "cursor-1" },
    undefined
  );
});

test("saved comparisons loader returns unauthorized status when GraphQL returns an unauthorized error", async () => {
  const request = new Request("https://app.example.com/compare/saved");
  const originalWindow = globalThis.window;

  vi.stubGlobal("window", undefined);
  fetchGraphQLMock.mockResolvedValue({
    errors: [
      {
        message: "Unauthorized",
        path: ["mySavedComparisonSets"]
      }
    ]
  });

  try {
    await expect(
      savedComparisonsLoader({
        request,
        params: {},
        context: undefined
      } as LoaderFunctionArgs)
    ).resolves.toEqual({
      status: "unauthorized",
      savedSets: []
    });
  } finally {
    vi.stubGlobal("window", originalWindow);
  }

  expect(fetchGraphQLMock).toHaveBeenCalledWith(
    expect.stringContaining("query MySavedComparisonSets"),
    { first: 20 },
    { request, signal: request.signal }
  );
});

test("saved comparisons route renders persisted sets with reopen links", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: [DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const openComparisonLinks = screen.getAllByRole("link", { name: "Open comparison" });

  expect(screen.getByRole("heading", { name: "Saved comparisons" })).toBeInTheDocument();
  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(openComparisonLinks).toHaveLength(2);
  expect(openComparisonLinks[0]).toHaveAttribute(
    "href",
    `/compare?slug=${SECOND_PRODUCT.slug}&slug=${DETAIL_PRODUCT.slug}`
  );
});

test("compare route exposes a named region for the compare shell", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    slugs: ["detail-product", "second-product"],
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

  render(<CompareRoute />);

  expect(
    screen.getByRole("region", {
      name: "Compare products"
    })
  ).toBeInTheDocument();
});

test("saved comparisons route exposes a named saved-set list and polite feedback region", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [{ id: "saved-set-1", name: "Desk setup", slugs: ["desk", "chair"] }]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("list", { name: "Saved comparison sets" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
});

test("saved comparisons route removes a deleted set from the list", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1"
        },
        errors: []
      }
    }
  });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: [DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getAllByRole("button", { name: "Delete comparison" })[0]);

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation DeleteSavedComparisonSet"),
      {
        savedComparisonSetId: "saved-set-1"
      },
      undefined
    );
  });

  await waitFor(() => {
    expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
    expect(screen.getByText("Office setup")).toBeInTheDocument();
  });

  expect(screen.getByRole("status")).toHaveTextContent("Comparison deleted.");
});

test("saved comparisons route keeps the set visible when delete fails and clears pending state", async () => {
  fetchGraphQLMock.mockRejectedValueOnce(new Error("Network request failed: boom"));

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const deleteButton = screen.getAllByRole("button", { name: "Delete comparison" })[0];

  fireEvent.click(deleteButton);

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation DeleteSavedComparisonSet"),
      {
        savedComparisonSetId: "saved-set-1"
      },
      undefined
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Delete comparison" })).toBeEnabled();
  });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Request failed. Please try again.");
});

test("saved comparisons route keeps the set visible when delete returns GraphQL errors and clears pending state", async () => {
  fetchGraphQLMock.mockResolvedValueOnce({
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: null,
        errors: [
          {
            code: "BAD_USER_INPUT",
            field: "savedComparisonSetId",
            message: "Could not delete this comparison set."
          }
        ]
      }
    }
  });

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete comparison" }));

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation DeleteSavedComparisonSet"),
      {
        savedComparisonSetId: "saved-set-1"
      },
      undefined
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Delete comparison" })).toBeEnabled();
  });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Could not delete this comparison set.");
});

test("saved comparisons route applies overlapping delete responses against the latest list state", async () => {
  const firstDelete = createDeferred<{
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: string;
        } | null;
        errors: [];
      };
    };
  }>();
  const secondDelete = createDeferred<{
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: string;
        } | null;
        errors: [];
      };
    };
  }>();

  fetchGraphQLMock
    .mockImplementationOnce(() => firstDelete.promise)
    .mockImplementationOnce(() => secondDelete.promise);

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: [DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const deleteButtons = screen.getAllByRole("button", { name: "Delete comparison" });

  fireEvent.click(deleteButtons[0]);
  fireEvent.click(deleteButtons[1]);

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
  });

  await act(async () => {
    secondDelete.resolve({
      data: {
        deleteSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-2"
          },
          errors: []
        }
      }
    });

    await secondDelete.promise;
  });

  await act(async () => {
    firstDelete.resolve({
      data: {
        deleteSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-1"
          },
          errors: []
        }
      }
    });

    await firstDelete.promise;
  });

  await waitFor(() => {
    expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
    expect(screen.queryByText("Office setup")).not.toBeInTheDocument();
  });

  expect(screen.getByRole("status")).toHaveTextContent("No saved comparisons yet.");
});

test("saved comparisons route keeps later delete rows pending until their own response settles", async () => {
  const firstDelete = createDeferred<{
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: string;
        } | null;
        errors: [];
      };
    };
  }>();
  const secondDelete = createDeferred<{
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: string;
        } | null;
        errors: [];
      };
    };
  }>();

  fetchGraphQLMock
    .mockImplementationOnce(() => firstDelete.promise)
    .mockImplementationOnce(() => secondDelete.promise);

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: [SECOND_PRODUCT.slug, DETAIL_PRODUCT.slug]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: [DETAIL_PRODUCT.slug]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const deleteButtons = screen.getAllByRole("button", { name: "Delete comparison" });

  fireEvent.click(deleteButtons[0]);
  fireEvent.click(deleteButtons[1]);

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Deleting comparison..." })).toHaveLength(2);
  });

  await act(() => {
    firstDelete.resolve({
      data: {
        deleteSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-1"
          },
          errors: []
        }
      }
    });
  });

  expect(screen.getAllByRole("button", { name: "Deleting comparison..." })).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Deleting comparison..." })).toBeDisabled();

  await act(() => {
    secondDelete.resolve({
      data: {
        deleteSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-2"
          },
          errors: []
        }
      }
    });
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("No saved comparisons yet.");
  });
});

test("saved comparisons route prompts the user to sign in when the saved-set query is unauthorized", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "unauthorized",
    savedSets: []
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  expect(screen.getByText("Sign in to view saved comparisons.")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Sign in to view saved comparisons" })
  ).toHaveAttribute("href", "/auth/login");
});

test("isUnauthorizedSavedComparisonsResponse detects an unauthorized GraphQL error targeting the saved sets field", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Unauthorized",
          path: ["mySavedComparisonSets"]
        }
      ]
    })
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse detects an unauthorized response from extensions.code", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse(
      {
        errors: [
          {
            message: "Authentication failed",
            path: ["mySavedComparisonSets"],
            extensions: {
              code: "UNAUTHENTICATED"
            }
          }
        ]
      } as unknown as Parameters<typeof isUnauthorizedSavedComparisonsResponse>[0]
    )
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse detects fuzzy auth messages without extensions.code", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Access denied for saved comparison sets",
          path: ["mySavedComparisonSets"]
        }
      ]
    })
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse detects not authorized messages", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "You are not authorized to access saved comparison sets",
          path: ["mySavedComparisonSets"]
        }
      ]
    })
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse detects pathless unauthorized errors with an empty path", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Unauthorized",
          path: [],
          extensions: {
            code: "UNAUTHENTICATED"
          }
        }
      ]
    })
  ).toBe(true);
});

test("isUnauthorizedSavedComparisonsResponse returns false for unrelated GraphQL errors", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Internal server error",
          path: ["mySavedComparisonSets"]
        }
      ]
    })
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse returns false for unauthorized errors on a different field path", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      errors: [
        {
          message: "Unauthorized",
          path: ["someOtherField"]
        }
      ]
    })
  ).toBe(false);
});

test("isUnauthorizedSavedComparisonsResponse returns false when the response has no errors array", () => {
  expect(
    isUnauthorizedSavedComparisonsResponse({
      data: {
        mySavedComparisonSets: {
          edges: [],
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      }
    })
  ).toBe(false);
});

test("saved comparisons loader throws when the GraphQL response cannot be parsed", async () => {
  const request = new Request("https://app.example.com/compare/saved");

  fetchGraphQLMock.mockResolvedValue({
    data: {
      mySavedComparisonSets: {
        edges: "not-an-array"
      }
    }
  });

  await expect(
    savedComparisonsLoader({
      request,
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).rejects.toThrow("Failed to parse saved comparison sets response");
});

test("saved comparisons loader throws when page cap is reached before pagination completes", async () => {
  const request = new Request("https://app.example.com/compare/saved");

  // Simulate a response where hasNextPage is always true so the loader hits the cap.
  // We use mockImplementation to return the same paginated response for each call.
  let callCount = 0;

  fetchGraphQLMock.mockImplementation(() => {
    callCount += 1;

    return Promise.resolve({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: `saved-set-${callCount}`,
                name: `Set ${callCount}`,
                items: [
                  {
                    position: 1,
                    product: {
                      id: DETAIL_PRODUCT.id,
                      slug: DETAIL_PRODUCT.slug,
                      name: DETAIL_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: `cursor-${callCount}`
          }
        }
      }
    });
  });

  await expect(
    savedComparisonsLoader({
      request,
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).rejects.toThrow("Saved comparison sets pagination limit exceeded");

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(50);
});

test("saved comparisons loader returns empty status for zero saved sets with no truncation", async () => {
  const request = new Request("https://app.example.com/compare/saved");

  fetchGraphQLMock.mockResolvedValue({
    data: {
      mySavedComparisonSets: {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      }
    }
  });

  const result = await savedComparisonsLoader({
    request,
    params: {},
    context: undefined
  } as LoaderFunctionArgs);

  expect(result).toEqual({
    status: "empty",
    savedSets: []
  });
});

test("saved comparisons loader aborts pagination when the request is cancelled", async () => {
  const controller = new AbortController();
  const originalWindow = globalThis.window;
  const request = {
    headers: new Headers(),
    signal: controller.signal,
    url: "https://app.example.com/compare/saved"
  } as unknown as Request;

  fetchGraphQLMock.mockImplementationOnce(async () => {
    controller.abort();

    return {
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: "saved-set-1",
                name: "Desk setup",
                items: [
                  {
                    position: 1,
                    product: {
                      id: DETAIL_PRODUCT.id,
                      slug: DETAIL_PRODUCT.slug,
                      name: DETAIL_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: "cursor-1"
          }
        }
      }
    };
  });

  vi.stubGlobal("window", undefined);

  try {
    await expect(
      savedComparisonsLoader({
        request,
        params: {},
        context: undefined
      } as LoaderFunctionArgs)
    ).rejects.toThrow(/aborted/i);
  } finally {
    vi.stubGlobal("window", originalWindow);
  }

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
  expect(fetchGraphQLMock).toHaveBeenCalledWith(
    expect.stringContaining("query MySavedComparisonSets"),
    { first: 20 },
    { request, signal: request.signal }
  );
});

test("saved comparisons loader throws when pagination cursor does not advance", async () => {
  const request = new Request("https://app.example.com/compare/saved");

  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: "saved-set-1",
                name: "Set 1",
                items: [
                  {
                    position: 1,
                    product: {
                      id: DETAIL_PRODUCT.id,
                      slug: DETAIL_PRODUCT.slug,
                      name: DETAIL_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: "cursor-1"
          }
        }
      }
    })
    .mockResolvedValueOnce({
      data: {
        mySavedComparisonSets: {
          edges: [
            {
              node: {
                id: "saved-set-2",
                name: "Set 2",
                items: [
                  {
                    position: 1,
                    product: {
                      id: SECOND_PRODUCT.id,
                      slug: SECOND_PRODUCT.slug,
                      name: SECOND_PRODUCT.name
                    }
                  }
                ]
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: "cursor-1"
          }
        }
      }
    });

  await expect(
    savedComparisonsLoader({
      request,
      params: {},
      context: undefined
    } as LoaderFunctionArgs)
  ).rejects.toThrow("Invalid pagination cursor");
});
