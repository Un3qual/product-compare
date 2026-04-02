import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useLoaderData } from "react-router-dom";
import { fetchGraphQL } from "../../../relay/fetch-graphql";
import { CompareRoute } from "../index";

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

const READY_LOADER_DATA = {
  status: "ready",
  slugs: ["desk-lamp"],
  products: [
    {
      id: "product-1",
      name: "Desk Lamp",
      slug: "desk-lamp",
      description: "A warm desk lamp.",
      brandName: "Acme"
    }
  ]
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
  mockedUseLoaderData.mockReset();
});

test("compare route only submits one save mutation while the request is in flight", async () => {
  const saveRequest = createDeferred<{
    data: {
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: string;
        } | null;
        errors: [];
      };
    };
  }>();

  fetchGraphQLMock.mockImplementation(() => saveRequest.promise);
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  render(<CompareRoute />);

  const saveButton = screen.getByRole("button", { name: "Save comparison" });

  act(() => {
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
  });

  expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);

  await act(async () => {
    saveRequest.resolve({
      data: {
        createSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-1"
          },
          errors: []
        }
      }
    });

    await saveRequest.promise;
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("Comparison saved.");
  });
});

test("compare route keeps a stable status region in the DOM before and after save success", async () => {
  fetchGraphQLMock.mockResolvedValue({
    data: {
      createSavedComparisonSet: {
        savedComparisonSet: {
          id: "saved-set-1"
        },
        errors: []
      }
    }
  });
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  render(<CompareRoute />);

  expect(screen.getByRole("status")).toBeEmptyDOMElement();

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("mutation CreateSavedComparisonSet"),
      {
        input: {
          name: "Desk Lamp comparison",
          productIds: ["product-1"]
        }
      }
    );
  });

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("Comparison saved.");
  });
});

test("compare route allows a later save after the current request settles", async () => {
  fetchGraphQLMock
    .mockResolvedValueOnce({
      data: {
        createSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-1"
          },
          errors: []
        }
      }
    })
    .mockResolvedValueOnce({
      data: {
        createSavedComparisonSet: {
          savedComparisonSet: {
            id: "saved-set-2"
          },
          errors: []
        }
      }
    });
  mockedUseLoaderData.mockReturnValue(READY_LOADER_DATA);

  render(<CompareRoute />);

  const saveButton = screen.getByRole("button", { name: "Save comparison" });

  fireEvent.click(saveButton);

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledTimes(1);
  });

  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
  });
});
