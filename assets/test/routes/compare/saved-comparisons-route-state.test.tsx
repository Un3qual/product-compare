import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RelayEnvironmentProvider } from "react-relay";
import { createOperationDescriptor, getRequest, type PayloadData } from "relay-runtime";
import savedComparisonsRouteQueryArtifact, {
  type SavedComparisonsRouteQuery,
} from "../../../src/__generated__/SavedComparisonsRouteQuery.graphql";
import { createRelayEnvironment } from "../../../src/relay/environment";
import { SavedComparisonsRoute } from "../../../src/routes/compare/saved/SavedComparisonsRoute";
import { chooseSelectOption } from "../../helpers/base-select";

const { fetchGraphQLMock, useLoaderDataMock } = vi.hoisted(() => ({
  fetchGraphQLMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
}));

vi.mock("../../../src/relay/fetch-graphql", () => ({ fetchGraphQL: fetchGraphQLMock }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useLoaderData: useLoaderDataMock };
});

beforeEach(() => {
  fetchGraphQLMock.mockReset();
  useLoaderDataMock.mockReset();
});

test("saved comparisons reopens, paginates, filters, and sorts Relay-backed sets", () => {
  renderReadySavedComparisons();

  const openComparison = within(actionsFor("Desk setup")).getByRole("link", {
    name: "Open comparison",
  });
  expect(openComparison).toHaveAttribute("href", "/compare?slug=chair&slug=desk");
  expect(openComparison).not.toHaveAttribute("data-slot", "button");
  expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
    "href",
    "/compare/saved?after=cursor-2",
  );
  expect(savedComparisonNames()).toEqual(["Desk setup", "Alpha kit"]);

  chooseSelectOption(screen.getByRole("combobox", { name: "Sort saved comparisons" }), "Name A-Z");
  expect(savedComparisonNames()).toEqual(["Alpha kit", "Desk setup"]);

  fireEvent.change(screen.getByRole("textbox", { name: "Filter saved comparisons" }), {
    target: { value: "desk" },
  });
  expect(savedComparisonNames()).toEqual(["Desk setup"]);
});

test("saved comparisons deletes a Relay-backed set after confirmation", async () => {
  fetchGraphQLMock.mockResolvedValueOnce({
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: { id: "saved-set-1" },
        errors: [],
      },
    },
  });
  renderReadySavedComparisons();

  fireEvent.click(
    within(actionsFor("Desk setup")).getByRole("button", { name: "Delete comparison" }),
  );
  fireEvent.click(
    within(screen.getByRole("alertdialog", { name: "Delete this saved comparison?" })).getByRole(
      "button",
      { name: "Delete comparison" },
    ),
  );

  await waitFor(() => {
    expect(fetchGraphQLMock).toHaveBeenCalledWith(
      expect.stringContaining("SavedComparisonSetListDeleteSavedComparisonSetMutation"),
      { savedComparisonSetId: "saved-set-1" },
      expect.anything(),
    );
  });
  await waitFor(() => {
    expect(screen.queryByRole("heading", { name: "Desk setup" })).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Saved comparisons status" })).toHaveTextContent(
      "Comparison deleted.",
    );
  });
});

test("saved comparisons preserves a set and reports typed deletion failure", async () => {
  fetchGraphQLMock.mockResolvedValueOnce({
    data: {
      deleteSavedComparisonSet: {
        savedComparisonSet: null,
        errors: [
          { code: "INVALID_ARGUMENT", field: null, message: "Unable to delete this comparison." },
        ],
      },
    },
  });
  renderReadySavedComparisons();

  fireEvent.click(
    within(actionsFor("Desk setup")).getByRole("button", { name: "Delete comparison" }),
  );
  fireEvent.click(
    within(screen.getByRole("alertdialog", { name: "Delete this saved comparison?" })).getByRole(
      "button",
      { name: "Delete comparison" },
    ),
  );

  expect(await screen.findByText("Unable to delete this comparison.")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Desk setup" })).toBeVisible();
});

test("saved comparisons shows the sign-in path without mounting Relay data", () => {
  useLoaderDataMock.mockReturnValue({ status: "unauthorized" });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "Sign in to view saved comparisons" })).toHaveAttribute(
    "href",
    "/auth/login",
  );
});

function renderReadySavedComparisons() {
  const environment = createRelayEnvironment();
  const variables: SavedComparisonsRouteQuery["variables"] = { first: 20 };
  environment.commitPayload(
    createOperationDescriptor(getRequest(savedComparisonsRouteQueryArtifact), variables),
    savedComparisonsResponse(),
  );
  const descriptor = {
    __relayQuery: {
      operationName: savedComparisonsRouteQueryArtifact.params.name,
      text: savedComparisonsRouteQueryArtifact.params.text,
      variables,
    },
  };
  useLoaderDataMock.mockReturnValue({ status: "ready", after: null, query: descriptor });

  return render(
    <RelayEnvironmentProvider environment={environment}>
      <MemoryRouter>
        <SavedComparisonsRoute />
      </MemoryRouter>
    </RelayEnvironmentProvider>,
  );
}

function savedComparisonsResponse(): PayloadData {
  return {
    mySavedComparisonSets: {
      edges: [
        {
          node: {
            id: "saved-set-1",
            name: "Desk setup",
            items: [
              { position: 2, product: { id: "product-desk", name: "Standing Desk", slug: "desk" } },
              {
                position: 1,
                product: { id: "product-chair", name: "Ergonomic Chair", slug: "chair" },
              },
            ],
          },
        },
        {
          node: {
            id: "saved-set-2",
            name: "Alpha kit",
            items: [{ position: 1, product: { id: "product-lamp", name: "Lamp", slug: "lamp" } }],
          },
        },
      ],
      pageInfo: { endCursor: "cursor-2", hasNextPage: true },
    },
  };
}

function savedComparisonNames() {
  return within(screen.getByRole("list", { name: "Saved comparison sets" }))
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
}

function actionsFor(name: string) {
  return screen.getByRole("group", { name: `Actions for ${name}` });
}
