import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useLazyLoadQuery, useMutation, usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../route-errors";
import { CompareRoute } from "../index";

const {
  commitMutationMock,
  useLazyLoadQueryMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  useLazyLoadQueryMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useLazyLoadQuery: useLazyLoadQueryMock,
    useMutation: useMutationMock,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../relay/route-preload")>(
    "../../../relay/route-preload"
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const DESK_LAMP = {
  id: "product-1",
  name: "Desk Lamp",
  slug: "desk-lamp",
  description: "A warm desk lamp.",
  brand: {
    id: "brand-1",
    name: "Acme"
  },
  currentAttributes: []
} as const;

const DESK_CHAIR = {
  id: "product-2",
  name: "Desk Chair",
  slug: "desk-chair",
  description: "An ergonomic chair.",
  brand: {
    id: "brand-2",
    name: "OfficeCo"
  },
  currentAttributes: []
} as const;

const deskLampQueryDescriptor = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: DESK_LAMP.slug }
  }
};

const deskChairQueryDescriptor = {
  __relayQuery: {
    operationName: "ProductDetailRouteQuery",
    text: "query ProductDetailRouteQuery($slug: String!) { product(slug: $slug) { id } }",
    variables: { slug: DESK_CHAIR.slug }
  }
};

const deskLampQueryRef = {
  dispose: vi.fn(),
  variables: deskLampQueryDescriptor.__relayQuery.variables
};

const deskChairQueryRef = {
  dispose: vi.fn(),
  variables: deskChairQueryDescriptor.__relayQuery.variables
};

const READY_LOADER_DATA = {
  status: "ready",
  slugs: [DESK_LAMP.slug],
  productQueries: [deskLampQueryDescriptor],
  products: [
    {
      id: DESK_LAMP.id,
      name: DESK_LAMP.name,
      slug: DESK_LAMP.slug,
      description: DESK_LAMP.description,
      brandName: DESK_LAMP.brand.name
    }
  ]
} as const;

const SECOND_READY_LOADER_DATA = {
  status: "ready",
  slugs: [DESK_CHAIR.slug],
  productQueries: [deskChairQueryDescriptor],
  products: [
    {
      id: DESK_CHAIR.id,
      name: DESK_CHAIR.name,
      slug: DESK_CHAIR.slug,
      description: DESK_CHAIR.description,
      brandName: DESK_CHAIR.brand.name
    }
  ]
} as const;

beforeEach(() => {
  commitMutationMock.mockReset();
  useLazyLoadQueryMock.mockReset();
  mockedUseLoaderData.mockReset();
  mockedUseMutation.mockReset();
  mockedUsePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  deskLampQueryRef.dispose.mockReset();
  deskChairQueryRef.dispose.mockReset();
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: []
    }
  });
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
  mockRouteQueryRefs();
  mockProductQueries();
});

test("compare route only submits one save mutation while the request is in flight", async () => {
  let pendingCompletion: ((response: unknown) => void) | undefined;

  commitMutationMock.mockImplementation(({ onCompleted }) => {
    pendingCompletion = onCompleted;
  });
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  render(compareRouteElement());

  const saveButton = screen.getByRole("button", { name: "Save comparison" });

  act(() => {
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
  });

  expect(commitMutationMock).toHaveBeenCalledTimes(1);

  act(() => {
    pendingCompletion?.({
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1"
        },
        errors: []
      }
    });
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("Comparison saved.");
  });
});

test("compare route keeps a stable status region in the DOM before and after save success", async () => {
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
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  render(compareRouteElement());

  expect(screen.getByRole("status")).toBeEmptyDOMElement();

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            name: "Desk Lamp comparison",
            productIds: ["product-1"]
          }
        }
      })
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("Comparison saved.");
  });
});

test("compare route reports a generic error when save completes with top-level GraphQL errors", async () => {
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(
      {
        createSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-1"
          },
          errors: [
            {
              code: "INVALID_ARGUMENT",
              field: "productIds",
              message: "Payload detail should not win"
            }
          ]
        }
      },
      [{ message: "database stacktrace" }]
    );
  });
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  render(compareRouteElement());

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(DEFAULT_ROUTE_ERROR_MESSAGE);
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

test("compare route allows a later save after the current request settles", async () => {
  const completions: Array<(response: unknown) => void> = [];

  commitMutationMock.mockImplementation(({ onCompleted }) => {
    completions.push(onCompleted);
  });
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  render(compareRouteElement());

  const saveButton = screen.getByRole("button", { name: "Save comparison" });

  fireEvent.click(saveButton);

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(1);
  });

  act(() => {
    completions[0]?.({
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1"
        },
        errors: []
      }
    });
  });

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(2);
  });
});

test("compare route clears save feedback when the selected comparison changes", async () => {
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
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  const { rerender } = render(compareRouteElement());

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("Comparison saved.");
  });

  mockedUseLoaderData.mockReturnValue(SECOND_READY_LOADER_DATA);
  rerender(compareRouteElement());

  await waitFor(() => {
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
  expect(screen.getByRole("heading", { name: DESK_CHAIR.name })).toBeInTheDocument();
});

test("compare route ignores stale save completions after the selected comparison changes", async () => {
  let completeFirstSelection: ((response: unknown) => void) | undefined;

  commitMutationMock.mockImplementation(({ onCompleted }) => {
    completeFirstSelection = onCompleted;
  });
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  const { rerender } = render(compareRouteElement());

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(1);
  });

  mockedUseLoaderData.mockReturnValue(SECOND_READY_LOADER_DATA);
  rerender(compareRouteElement());

  act(() => {
    completeFirstSelection?.({
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1"
        },
        errors: []
      }
    });
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
  expect(screen.getByRole("heading", { name: DESK_CHAIR.name })).toBeInTheDocument();
});

test("compare route enables saving a new selection while the previous Relay mutation is in flight", async () => {
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  const { rerender } = render(compareRouteElement());

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(1);
  });

  mockedUseLoaderData.mockReturnValue(SECOND_READY_LOADER_DATA);
  mockedUseMutation.mockReturnValue([commitMutationMock, true]);
  rerender(compareRouteElement());

  const saveButton = screen.getByRole("button", { name: "Save comparison" });
  expect(saveButton).toBeEnabled();

  fireEvent.click(saveButton);

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(2);
  });
});

function mockRouteQueryRefs() {
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => {
    if (descriptor === deskLampQueryDescriptor) {
      return deskLampQueryRef;
    }

    if (descriptor === deskChairQueryDescriptor) {
      return deskChairQueryRef;
    }

    throw new Error(`Unexpected query descriptor: ${JSON.stringify(descriptor)}`);
  });
}

function compareRouteElement() {
  return (
    <MemoryRouter>
      <CompareRoute />
    </MemoryRouter>
  );
}

function mockProductQueries() {
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === deskLampQueryRef) {
      return {
        product: DESK_LAMP
      };
    }

    if (queryRef === deskChairQueryRef) {
      return {
        product: DESK_CHAIR
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });
}
