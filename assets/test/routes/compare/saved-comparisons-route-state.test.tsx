import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../src/relay/route-preload";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../src/routes/route-errors";
import { SavedComparisonsRoute, savedComparisonSetQueryKey } from "../../../src/routes/compare/saved";
import { buildSuccessfulDeleteResponse } from "./saved-comparisons-test-helpers";
import type { DeleteSavedComparisonSetMutationResponse } from "./saved-comparisons-test-helpers";

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

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload"
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

const SAVED_SET_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "SavedComparisonsRouteQuery",
    text: "query SavedComparisonsRouteQuery($first: Int!, $after: String) { mySavedComparisonSets(first: $first, after: $after) { edges { node { id } } } }",
    variables: {
      first: 20
    }
  }
};

const SAVED_SET_QUERY_REF = {
  dispose: vi.fn(),
  variables: SAVED_SET_QUERY_DESCRIPTOR.__relayQuery.variables
};

beforeEach(() => {
  commitMutationMock.mockReset();
  mockedUseLoaderData.mockReset();
  mockedUseMutation.mockReset();
  mockedUsePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  SAVED_SET_QUERY_REF.dispose.mockReset();
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
  mockedUseRoutePreloadedQuery.mockReturnValue(SAVED_SET_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildSavedComparisonSetsPageData([buildSavedSet()]));
});

const buildSavedSet = () => {
  return {
    id: "saved-set-1",
    name: "Desk setup",
    slugs: ["chair", "desk"]
  };
};

const buildReadyLoaderData = () => {
  return {
    status: "ready" as const,
    savedSets: [buildSavedSet()]
  };
};

test("saved comparisons route ignores duplicate delete clicks for the same row", async () => {
  let completeDelete!: (response: DeleteSavedComparisonSetMutationResponse) => void;

  commitMutationMock.mockImplementation(({ onCompleted }) => {
    completeDelete = onCompleted;
  });
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const deleteButton = screen.getByRole("button", { name: "Delete comparison" });

  fireEvent.click(deleteButton);
  fireEvent.click(deleteButton);

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledTimes(1);
  });

  expect(screen.getByRole("button", { name: "Deleting comparison..." })).toBeDisabled();

  act(() => {
    completeDelete(buildSuccessfulDeleteResponse("saved-set-1"));
  });
});

test("saved comparisons route starts with an empty status region when saved sets are present", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

test("saved comparisons route announces deletion when deleting the last set", async () => {
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(buildSuccessfulDeleteResponse("saved-set-1"));
  });
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete comparison" }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          savedComparisonSetId: "saved-set-1"
        }
      })
    );
  });

  await waitFor(() => {
    expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
  });

  expect(screen.getByRole("status")).toHaveTextContent("Comparison deleted.");
  expect(screen.getByRole("status")).not.toHaveTextContent("No saved comparisons yet.");
});

test("saved comparisons route uses a descriptive sign-in link for unauthorized state", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "unauthorized",
    savedSets: []
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  expect(
    screen.getByRole("link", { name: "Sign in to view saved comparisons" })
  ).toBeInTheDocument();
});

test("saved comparisons route clears stale delete errors when a later delete succeeds", async () => {
  const commits: Array<{
    onCompleted: (response: DeleteSavedComparisonSetMutationResponse) => void;
  }> = [];

  commitMutationMock.mockImplementation((config) => {
    commits.push(config);
  });
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: ["chair", "desk"]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: ["lamp"]
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
    expect(commits).toHaveLength(2);
  });

  act(() => {
    commits[0].onCompleted({
      deleteSavedComparisonSet: {
        savedComparisonSet: null,
        errors: [
          {
            code: "GRAPHQL_ERROR",
            field: null,
            message: "Request failed. Please try again."
          }
        ]
      }
    });
  });

  act(() => {
    commits[1].onCompleted(buildSuccessfulDeleteResponse("saved-set-2"));
  });

  await waitFor(() => {
    expect(screen.getByText("Desk setup")).toBeInTheDocument();
    expect(screen.queryByText("Office setup")).not.toBeInTheDocument();
  });

  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("saved comparisons route submits the saved-set ID as Relay mutation variables", async () => {
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(buildSuccessfulDeleteResponse("saved-set-1"));
  });
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete comparison" }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          savedComparisonSetId: "saved-set-1"
        }
      })
    );
  });
});

test("saved comparisons route keeps the set visible when the Relay mutation returns typed errors", async () => {
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted({
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
    });
  });
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete comparison" }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          savedComparisonSetId: "saved-set-1"
        }
      })
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Delete comparison" })).toBeEnabled();
  });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Could not delete this comparison set.");
});

test("saved comparisons route filters loaded sets by saved-set name", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSetQueries: [],
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: ["chair", "desk"]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: ["lamp", "table"]
      },
      {
        id: "saved-set-3",
        name: "Outdoor gear",
        slugs: ["tent", "rucksack"]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const filterInput = screen.getByRole("textbox", { name: "Filter saved comparisons" });

  fireEvent.change(filterInput, { target: { value: "dEsK" } });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.queryByText("Office setup")).not.toBeInTheDocument();
  expect(screen.queryByText("Outdoor gear")).not.toBeInTheDocument();
});

test("saved comparisons route filters loaded sets by product slug", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSetQueries: [],
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: ["chair", "desk"]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: ["lamp", "table"]
      },
      {
        id: "saved-set-3",
        name: "Outdoor gear",
        slugs: ["tent", "rucksack"]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const filterInput = screen.getByRole("textbox", { name: "Filter saved comparisons" });

  fireEvent.change(filterInput, { target: { value: "TaBlE" } });

  expect(screen.getByText("Office setup")).toBeInTheDocument();
  expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
  expect(screen.queryByText("Outdoor gear")).not.toBeInTheDocument();
});

test("saved comparisons route filters Relay-backed saved set pages", () => {
  const savedSets = [
    {
      id: "saved-set-1",
      name: "Desk setup",
      slugs: ["chair", "desk"]
    },
    {
      id: "saved-set-2",
      name: "Office setup",
      slugs: ["lamp", "table"]
    },
    {
      id: "saved-set-3",
      name: "Outdoor gear",
      slugs: ["tent", "rucksack"]
    }
  ];

  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSetQueries: [SAVED_SET_QUERY_DESCRIPTOR],
    savedSets
  });
  mockedUsePreloadedQuery.mockReturnValue(buildSavedComparisonSetsPageData(savedSets));

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const filterInput = screen.getByRole("textbox", { name: "Filter saved comparisons" });

  fireEvent.change(filterInput, { target: { value: "dEsK" } });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.queryByText("Office setup")).not.toBeInTheDocument();
  expect(screen.queryByText("Outdoor gear")).not.toBeInTheDocument();

  fireEvent.change(filterInput, { target: { value: "TaBlE" } });

  expect(screen.getByText("Office setup")).toBeInTheDocument();
  expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
  expect(screen.queryByText("Outdoor gear")).not.toBeInTheDocument();
});

test("saved comparisons route shows a no-match message when the filter excludes all saved sets", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSetQueries: [],
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: ["chair", "desk"]
      },
      {
        id: "saved-set-2",
        name: "Office setup",
        slugs: ["lamp", "table"]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByRole("textbox", { name: "Filter saved comparisons" }), {
    target: {
      value: "non-matching-value"
    }
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent(
      "No saved comparisons match your filter."
    );
  });
});

test("saved comparisons route preserves pending delete state when the filter changes", async () => {
  const commits: Array<{
    onCompleted: (response: DeleteSavedComparisonSetMutationResponse) => void;
  }> = [];

  commitMutationMock.mockImplementation((config) => {
    commits.push(config);
  });
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSetQueries: [],
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: ["chair", "desk"]
      },
      {
        id: "saved-set-2",
        name: "Desk setup alt",
        slugs: ["lamp"]
      }
    ]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const filterInput = screen.getByRole("textbox", { name: "Filter saved comparisons" });

  fireEvent.change(filterInput, { target: { value: "desk" } });
  const [savedSetDeleteButton] = screen.getAllByRole("button", { name: "Delete comparison" });
  fireEvent.click(savedSetDeleteButton);

  await waitFor(() => {
    expect(commits).toHaveLength(1);
  });

  fireEvent.change(filterInput, { target: { value: "desk setup" } });

  expect(screen.getByRole("button", { name: "Deleting comparison..." })).toBeDisabled();

  act(() => {
    commits[0].onCompleted(buildSuccessfulDeleteResponse("saved-set-1"));
  });

  await waitFor(() => {
    expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
    expect(screen.getByText("Desk setup alt")).toBeInTheDocument();
  });
});

test("saved comparisons route keeps delete errors visible when the filter changes", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSetQueries: [],
    savedSets: [
      {
        id: "saved-set-1",
        name: "Desk setup",
        slugs: ["chair", "desk"]
      },
      {
        id: "saved-set-2",
        name: "Desk setup alt",
        slugs: ["lamp"]
      }
    ]
  });
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted({
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
    });
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  const filterInput = screen.getByRole("textbox", { name: "Filter saved comparisons" });
  const [deleteButton] = screen.getAllByRole("button", { name: "Delete comparison" });

  fireEvent.change(filterInput, { target: { value: "desk setup" } });
  fireEvent.click(deleteButton);

  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent("Could not delete this comparison set.");
  });

  fireEvent.change(filterInput, { target: { value: "desk setup alt" } });

  expect(screen.getByRole("alert")).toHaveTextContent("Could not delete this comparison set.");
});

test("saved comparisons route keeps the set visible when delete completes with top-level GraphQL errors", async () => {
  commitMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(buildSuccessfulDeleteResponse("saved-set-1"), [
      { message: "database stacktrace" }
    ]);
  });
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete comparison" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Delete comparison" })).toBeEnabled();
  });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(DEFAULT_ROUTE_ERROR_MESSAGE);
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

test("saved comparisons route reports Relay mutation network failures", async () => {
  commitMutationMock.mockImplementation(({ onError }) => {
    onError(new Error("Network request failed: boom"));
  });
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete comparison" }));

  await waitFor(() => {
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          savedComparisonSetId: "saved-set-1"
        }
      })
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Delete comparison" })).toBeEnabled();
  });

  expect(screen.getByText("Desk setup")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Request failed. Please try again.");
});

test("saved comparison query keys are stable across variable property order", () => {
  const firstKey = savedComparisonSetQueryKey({
    __relayQuery: {
      operationName: "SavedComparisonsRouteQuery",
      text: "query SavedComparisonsRouteQuery($first: Int!, $after: String) { mySavedComparisonSets(first: $first, after: $after) { edges { node { id } } } }",
      variables: {
        first: 20,
        after: "cursor-1"
      }
    }
  });
  const secondKey = savedComparisonSetQueryKey({
    __relayQuery: {
      operationName: "SavedComparisonsRouteQuery",
      text: "query SavedComparisonsRouteQuery($first: Int!, $after: String) { mySavedComparisonSets(first: $first, after: $after) { edges { node { id } } } }",
      variables: {
        after: "cursor-1",
        first: 20
      }
    }
  });

  expect(secondKey).toBe(firstKey);
});

function buildSavedComparisonSetsPageData(
  savedSets: Array<{ id: string; name: string; slugs: string[] }>
) {
  return {
    mySavedComparisonSets: {
      edges: savedSets.map((savedSet) => ({
        node: {
          id: savedSet.id,
          name: savedSet.name,
          items: savedSet.slugs.map((slug, index) => ({
            position: index,
            product: {
              slug
            }
          }))
        }
      })),
      pageInfo: {
        hasNextPage: false,
        endCursor: null
      }
    }
  };
}
