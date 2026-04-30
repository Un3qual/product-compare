import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useLoaderData } from "react-router-dom";
import { useMutation } from "react-relay";
import { CompareRoute } from "../index";

const { commitMutationMock, useLoaderDataMock, useMutationMock } = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn()
}));

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useMutation: useMutationMock
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

beforeEach(() => {
  commitMutationMock.mockReset();
  mockedUseLoaderData.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([commitMutationMock, false]);
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

  await act(async () => {
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

  await act(async () => {
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
