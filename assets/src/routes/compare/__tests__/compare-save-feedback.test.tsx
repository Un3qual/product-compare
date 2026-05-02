import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { CompareRoute } from "../index";

const {
  commitMutationMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
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
  }
} as const;

const DESK_CHAIR = {
  id: "product-2",
  name: "Desk Chair",
  slug: "desk-chair",
  description: "An ergonomic chair.",
  brand: {
    id: "brand-2",
    name: "OfficeCo"
  }
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
  mockedUseLoaderData.mockReset();
  mockedUseMutation.mockReset();
  mockedUsePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  deskLampQueryRef.dispose.mockReset();
  deskChairQueryRef.dispose.mockReset();
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

  render(<CompareRoute />);

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

  render(<CompareRoute />);

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

test("compare route allows a later save after the current request settles", async () => {
  const completions: Array<(response: unknown) => void> = [];

  commitMutationMock.mockImplementation(({ onCompleted }) => {
    completions.push(onCompleted);
  });
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  render(<CompareRoute />);

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

  const { rerender } = render(<CompareRoute />);

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("Comparison saved.");
  });

  mockedUseLoaderData.mockReturnValue(SECOND_READY_LOADER_DATA);
  rerender(<CompareRoute />);

  await waitFor(() => {
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
  expect(screen.getByRole("heading", { name: DESK_CHAIR.name })).toBeInTheDocument();
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
