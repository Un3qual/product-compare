import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import { MemoryRouter, useLoaderData } from "react-router-dom";
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

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  mockedUseLoaderData.mockReset();
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
  const deleteDeferred = createDeferred<{
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: {
          id: string;
        };
        errors: [];
      };
    };
  }>();

  fetchGraphQLMock.mockImplementation(() => deleteDeferred.promise);
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
    expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
  });

  expect(screen.getByRole("button", { name: "Deleting comparison..." })).toBeDisabled();

  await act(async () => {
    deleteDeferred.resolve({
      data: {
        deleteSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-1"
          },
          errors: []
        }
      }
    });

    await deleteDeferred.promise;
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

test("saved comparisons route shows the empty state after deleting the last set", async () => {
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
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

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
    expect(screen.queryByText("Desk setup")).not.toBeInTheDocument();
  });

  expect(screen.getByRole("status")).toHaveTextContent("No saved comparisons yet.");
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
