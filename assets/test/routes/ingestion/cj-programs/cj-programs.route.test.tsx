import { useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData, useRevalidator } from "react-router-dom";
import { useFragment, useMutation, usePreloadedQuery, useQueryLoader } from "react-relay";
import {
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "../../../../src/relay/route-preload";
import type { CJProgramsRouteQuery } from "../../../../src/__generated__/CJProgramsRouteQuery.graphql";
import type { UnmatchedFeedsQuery } from "../../../../src/__generated__/UnmatchedFeedsQuery.graphql";
import {
  CJProgramsRoute,
  type CJProgramsLoaderData,
} from "../../../../src/routes/ingestion/cj-programs/CJProgramsRoute";
import { chooseSelectOption, openSelect } from "../../../helpers/base-select";

const {
  commitUpdateMutationMock,
  disposeFeedQueryMock,
  loadFeedQueryMock,
  revalidateMock,
  useLoaderDataMock,
  useFragmentMock,
  useMutationMock,
  useQueryLoaderMock,
  usePreloadedQueryMock,
  useRevalidatorMock,
  useRoutePreloadedQueryMock,
} = vi.hoisted(() => ({
  commitUpdateMutationMock: vi.fn(),
  disposeFeedQueryMock: vi.fn(),
  loadFeedQueryMock: vi.fn(),
  revalidateMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useFragmentMock: vi.fn(),
  useMutationMock: vi.fn(),
  useQueryLoaderMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRevalidatorMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
    useRevalidator: useRevalidatorMock,
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useFragment: useFragmentMock,
    useMutation: useMutationMock,
    useQueryLoader: useQueryLoaderMock,
    usePreloadedQuery: usePreloadedQueryMock,
  };
});

vi.mock("../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/relay/route-preload")>(
    "../../../../src/relay/route-preload",
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock,
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseFragment = vi.mocked(useFragment);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUseQueryLoader = vi.mocked(useQueryLoader);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRevalidator = vi.mocked(useRevalidator);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const CJ_PROGRAMS_QUERY_DESCRIPTOR: RelayRouteQueryDescriptor<CJProgramsRouteQuery["variables"]> = {
  __relayQuery: {
    operationName: "CJProgramsRouteQuery",
    text: null,
    variables: {
      first: 20,
      after: null,
      stage: null,
      sort: "NAME_ASC",
    },
  },
};

const UNMATCHED_FEEDS_QUERY_DESCRIPTOR: RelayRouteQueryDescriptor<
  UnmatchedFeedsQuery["variables"]
> = {
  __relayQuery: {
    operationName: "UnmatchedFeedsQuery",
    text: null,
    variables: { first: 10, after: null },
  },
};

const FEED_QUERY_REF = { dispose: vi.fn() };

beforeEach(() => {
  commitUpdateMutationMock.mockReset();
  disposeFeedQueryMock.mockReset();
  loadFeedQueryMock.mockReset();
  revalidateMock.mockReset();
  mockedUseLoaderData.mockReset();
  mockedUseFragment.mockReset();
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  mockedUseMutation.mockReset();
  mockedUseQueryLoader.mockReset();
  mockedUsePreloadedQuery.mockReset();
  mockedUseRevalidator.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUseMutation.mockReturnValue([commitUpdateMutationMock, false]);
  mockedUseQueryLoader.mockReturnValue([null, loadFeedQueryMock, disposeFeedQueryMock] as never);
  mockedUseRevalidator.mockReturnValue({ revalidate: revalidateMock, state: "idle" });
  mockedUseRoutePreloadedQuery.mockReturnValue({ dispose: vi.fn() } as never);
  mockedUsePreloadedQuery.mockReturnValue(buildCJProgramsData());
});

test("CJ programs route gives operators its lifecycle workspace", () => {
  renderCJProgramsRoute();

  expect(screen.getByRole("heading", { name: "CJ programs" })).toBeInTheDocument();
  expect(
    screen.getByText(
      "Track each advertiser program from discovery through its application outcome.",
    ),
  ).toBeInTheDocument();
});

test("CJ programs route shows a route-local loading state while its query resolves", () => {
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Promise(() => undefined);
  });

  renderCJProgramsRoute();

  expect(screen.getByText("Loading CJ programs...")).toBeInTheDocument();
});

test("CJ programs route renders full-dataset stage counts and lifecycle controls", () => {
  renderCJProgramsRoute();

  const summary = screen.getByLabelText("CJ program lifecycle summary");

  expect(within(summary).getByText("New")).toBeInTheDocument();
  expect(within(summary).getByText("Considering")).toBeInTheDocument();
  expect(within(summary).getByText("Selected")).toBeInTheDocument();
  expect(within(summary).getByText("Applied")).toBeInTheDocument();
  expect(within(summary).getByText("Accepted")).toBeInTheDocument();
  expect(within(summary).getByText("Not pursuing")).toBeInTheDocument();
  expect(within(summary).getByText("Declined")).toBeInTheDocument();
  expect(within(summary).getAllByText("1")).toHaveLength(7);

  expect(screen.getByRole("combobox", { name: "Stage" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Sort programs" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Stage" })).toHaveTextContent("All stages");
  openSelect(screen.getByRole("combobox", { name: "Sort programs" }));
  expect(screen.getByRole("option", { name: "Last changed" })).toBeInTheDocument();
});

test("CJ programs route presents a scannable lifecycle ledger with exact change times", () => {
  renderCJProgramsRoute();

  const ledger = screen.getByRole("table", { name: "CJ program lifecycle ledger" });
  const headers = within(ledger).getAllByRole("columnheader");

  expect(headers.map((header) => header.textContent)).toEqual([
    "Merchant",
    "Lifecycle",
    "Last change",
    "Required action",
    "Controls",
  ]);

  const newMerchantRow = within(ledger).getByRole("row", { name: /New Merchant/ });
  expect(within(newMerchantRow).getByText("CJ Affiliate")).toBeInTheDocument();
  expect(within(newMerchantRow).getByText("Review feed warnings")).toBeInTheDocument();
  expect(within(newMerchantRow).getByText("Jul 20, 2026, 10:00 AM")).toHaveAttribute(
    "datetime",
    "2026-07-20T10:00:00.000000Z",
  );
});

test("CJ program rows expose every lifecycle stage and save a trimmed note", async () => {
  renderCJProgramsRoute();

  const stage = screen.getByRole("combobox", { name: "Stage for New Merchant" });
  openSelect(stage);
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "New",
    "Considering",
    "Selected",
    "Applied",
    "Accepted",
    "Not pursuing",
    "Declined",
  ]);

  chooseSelectOption(stage, "Declined");
  fireEvent.change(screen.getByLabelText("Note for New Merchant"), {
    target: { value: "  Not a fit now  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save New Merchant" }));

  await waitFor(() => {
    expect(commitUpdateMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            id: "program-1",
            stage: "DECLINED",
            note: "Not a fit now",
            expectedChangedAt: "2026-07-20T10:00:00.000000Z",
          },
        },
      }),
    );
  });
});

test("CJ program rows adopt refreshed lifecycle fields without discarding row feedback or expanded feeds", async () => {
  const initialData = buildCJProgramsData();
  mockedUsePreloadedQuery.mockReturnValue(initialData);
  commitUpdateMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(
      {
        updateCjProgram: {
          errors: [],
        },
      },
      null,
    );
  });

  const view = renderCJProgramsRoute();

  chooseSelectOption(screen.getByLabelText("Stage for New Merchant"), "Declined");
  fireEvent.change(screen.getByLabelText("Note for New Merchant"), {
    target: { value: "Local draft" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Show feeds for New Merchant" }));
  fireEvent.click(screen.getByRole("button", { name: "Save New Merchant" }));

  await waitFor(() => {
    expect(rowFor("New Merchant").getByRole("status")).toHaveTextContent("New Merchant saved.");
  });

  const refreshedData = buildCJProgramsData();
  const refreshedProgram = refreshedData.cjPrograms.edges[0]?.node;

  if (!refreshedProgram) {
    throw new Error("Expected a CJ program fixture.");
  }

  Object.assign(refreshedProgram, {
    stage: "APPLIED",
    note: "Server note",
    lastChanged: "2026-07-20T11:00:00.000000Z",
  });
  mockedUsePreloadedQuery.mockReturnValue(refreshedData);

  view.rerender(
    <MemoryRouter>
      <CJProgramsRoute />
    </MemoryRouter>,
  );

  expect(screen.getByLabelText("Stage for New Merchant")).toHaveValue("APPLIED");
  expect(screen.getByLabelText("Note for New Merchant")).toHaveValue("Server note");
  expect(rowFor("New Merchant").getByRole("status")).toHaveTextContent("New Merchant saved.");
  expect(screen.getByRole("button", { name: "Hide feeds for New Merchant" })).toBeInTheDocument();
});

test("an in-flight CJ program update shows row-local saving state and leaves another row interactive", async () => {
  mockedUseMutation.mockImplementation(useInFlightMutationMock as never);

  renderCJProgramsRoute();

  fireEvent.click(screen.getByRole("button", { name: "Save New Merchant" }));

  await waitFor(() => {
    expect(commitUpdateMutationMock).toHaveBeenCalledTimes(1);
    expect(rowFor("New Merchant").getByText("Saving...")).toBeVisible();
    expect(rowElementFor("New Merchant")).toHaveAttribute("aria-busy", "true");
  });

  expect(rowFor("New Merchant").getByLabelText("Stage for New Merchant")).toBeDisabled();
  expect(rowFor("New Merchant").getByLabelText("Note for New Merchant")).toBeDisabled();
  expect(rowFor("New Merchant").getByRole("button", { name: "Save New Merchant" })).toBeDisabled();
  expect(screen.getByLabelText("Stage for Considering Merchant")).toBeEnabled();
  expect(screen.getByLabelText("Note for Considering Merchant")).toBeEnabled();
  expect(screen.getByRole("button", { name: "Save Considering Merchant" })).toBeEnabled();
  expect(rowElementFor("Considering Merchant")).not.toHaveAttribute("aria-busy", "true");
});

test("CJ program mutation feedback remains with the row that saved", async () => {
  commitUpdateMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(
      {
        updateCjProgram: {
          errors: [],
        },
      },
      null,
    );
  });

  renderCJProgramsRoute();
  fireEvent.click(screen.getByRole("button", { name: "Save New Merchant" }));

  await waitFor(() => {
    expect(rowFor("New Merchant").getByRole("status")).toHaveTextContent("New Merchant saved.");
    expect(rowFor("Considering Merchant").queryByRole("status")).not.toBeInTheDocument();
    expect(revalidateMock).toHaveBeenCalledTimes(1);
  });
});

test("CJ program payload errors remain with the row that failed", async () => {
  commitUpdateMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(
      {
        updateCjProgram: {
          errors: [{ code: "INVALID_STAGE", field: "stage", message: "stage is unavailable" }],
        },
      },
      null,
    );
  });

  renderCJProgramsRoute();
  fireEvent.click(screen.getByRole("button", { name: "Save New Merchant" }));

  await waitFor(() => {
    expect(rowFor("New Merchant").getByRole("status")).toHaveTextContent("stage is unavailable");
    expect(rowFor("Considering Merchant").queryByRole("status")).not.toBeInTheDocument();
  });
});

test("a stale CJ program response reloads server state", async () => {
  commitUpdateMutationMock.mockImplementation(({ onCompleted }) => {
    onCompleted(
      {
        updateCjProgram: {
          errors: [
            {
              code: "CONFLICT",
              field: null,
              message: "program changed since it was loaded",
            },
          ],
        },
      },
      null,
    );
  });

  renderCJProgramsRoute();
  fireEvent.click(screen.getByRole("button", { name: "Save New Merchant" }));

  await waitFor(() => {
    expect(rowFor("New Merchant").getByRole("status")).toHaveTextContent(
      "program changed since it was loaded",
    );
    expect(revalidateMock).toHaveBeenCalledTimes(1);
  });
});

test("CJ program rows show factual advertiser details and plain warning copy", () => {
  renderCJProgramsRoute();

  const row = rowFor("New Merchant");

  expect(row.getByText("Advertiser ID advertiser-1")).toBeInTheDocument();
  expect(row.getByText("1 feed")).toBeInTheDocument();
  expect(row.getByText("Jul 20, 2026, 10:00 AM")).toHaveAttribute(
    "datetime",
    "2026-07-20T10:00:00.000000Z",
  );
  const warnings = row.getByRole("list", { name: "Warnings for New Merchant" });

  expect(
    within(warnings).getByText("At least one observed feed is missing an advertiser name."),
  ).toBeInTheDocument();
  expect(
    within(warnings).getByText("At least one observed feed has no positive product count."),
  ).toBeInTheDocument();
  expect(
    within(warnings).getByText("At least one observed feed is not marked for the US market."),
  ).toBeInTheDocument();
  expect(
    within(warnings).getByText("At least one observed feed is not marked with USD currency."),
  ).toBeInTheDocument();
  expect(
    within(warnings).getByText("At least one observed feed is not marked as English."),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Fit score/i)).not.toBeInTheDocument();
});

test("CJ program rows display an unknown future lifecycle stage without coercing it", () => {
  const data = buildCJProgramsData();
  const firstProgram = data.cjPrograms.edges[0]?.node;

  if (!firstProgram) {
    throw new Error("Expected a CJ program fixture.");
  }

  (firstProgram as { stage: string }).stage = "%future added value";
  mockedUsePreloadedQuery.mockReturnValue(data);

  renderCJProgramsRoute();

  expect(rowFor("New Merchant").getByText("%future added value")).toBeInTheDocument();
  expect(screen.getByLabelText("Stage for New Merchant")).toBeDisabled();
});

test("CJ program feed details wait for the first expansion before loading", () => {
  renderCJProgramsRoute();

  expect(loadFeedQueryMock).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Show feeds for New Merchant" }));

  expect(loadFeedQueryMock).toHaveBeenCalledWith(
    { id: "program-1", first: 10, after: null },
    expect.anything(),
  );
});

test("a failed CJ program feed query stays in its row and retries only that row", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockedUseQueryLoader.mockReturnValue([
    FEED_QUERY_REF,
    loadFeedQueryMock,
    disposeFeedQueryMock,
  ] as never);
  mockedUsePreloadedQuery
    .mockReturnValueOnce(buildCJProgramsData())
    .mockReturnValueOnce(buildCJProgramsData())
    .mockImplementation(() => {
      throw new Error("CJ program feed query failed");
    });

  try {
    renderCJProgramsRoute();
    fireEvent.click(screen.getByRole("button", { name: "Show feeds for New Merchant" }));

    expect(rowFor("New Merchant").getByRole("alert")).toHaveTextContent("Feeds unavailable.");
    expect(
      rowFor("New Merchant").getByRole("button", { name: "Retry feeds for New Merchant" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CJ programs" })).toBeInTheDocument();
    expect(screen.queryByText("CJ programs unavailable.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Stage for Considering Merchant")).toBeEnabled();
    chooseSelectOption(screen.getByLabelText("Stage for Considering Merchant"), "Accepted");
    expect(screen.getByLabelText("Stage for Considering Merchant")).toHaveValue("ACCEPTED");

    fireEvent.click(
      rowFor("New Merchant").getByRole("button", { name: "Retry feeds for New Merchant" }),
    );

    expect(loadFeedQueryMock).toHaveBeenNthCalledWith(
      2,
      { id: "program-1", first: 10, after: null },
      expect.anything(),
    );
  } finally {
    consoleError.mockRestore();
  }
});

test("an unavailable unmatched-feed region leaves the program lifecycle ledger usable", () => {
  mockedUseLoaderData.mockReturnValue({
    ...buildReadyLoaderData(),
    unmatchedQuery: null,
  } as never);

  renderCJProgramsRoute();

  expect(screen.getByRole("table", { name: "CJ program lifecycle ledger" })).toBeVisible();
  expect(screen.getByLabelText("Stage for New Merchant")).toBeEnabled();
  expect(screen.getByRole("alert")).toHaveTextContent("Unmatched feeds unavailable.");
  expect(screen.queryByText("CJ programs unavailable.")).not.toBeInTheDocument();
});

test("expanded CJ program rows render bounded feed facts and replace only their feed page", () => {
  mockedUseQueryLoader.mockReturnValue([
    FEED_QUERY_REF,
    loadFeedQueryMock,
    disposeFeedQueryMock,
  ] as never);
  mockedUsePreloadedQuery
    .mockReturnValueOnce(buildCJProgramsData())
    .mockReturnValueOnce(buildCJProgramsData())
    .mockReturnValueOnce(buildCJProgramFeedsData());

  renderCJProgramsRoute();
  fireEvent.click(screen.getByRole("button", { name: "Show feeds for New Merchant" }));

  const feedList = screen.getByRole("list", { name: "Feeds for New Merchant" });

  expect(within(feedList).getByText("Trail Shopping")).toBeInTheDocument();
  expect(within(feedList).getByText("Provider feed ID trail-shopping")).toBeInTheDocument();
  expect(within(feedList).getByText("Last seen Jul 20, 2026, 10:00 AM")).toBeInTheDocument();
  expect(within(feedList).getByText("5000 products")).toBeInTheDocument();
  expect(within(feedList).getByText("US")).toBeInTheDocument();
  expect(within(feedList).getByText("USD")).toBeInTheDocument();
  expect(within(feedList).getByText("EN")).toBeInTheDocument();
  expect(within(feedList).getByText("PRODUCT")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "First feeds for New Merchant" }));
  fireEvent.click(screen.getByRole("button", { name: "Next feeds for New Merchant" }));

  expect(loadFeedQueryMock).toHaveBeenNthCalledWith(
    2,
    { id: "program-1", first: 10, after: null },
    expect.anything(),
  );
  expect(loadFeedQueryMock).toHaveBeenNthCalledWith(
    3,
    { id: "program-1", first: 10, after: "feed-cursor-next" },
    expect.anything(),
  );
});

test("program and unmatched feed pagination keep their independent cursors", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 25,
      after: "program-current",
      stage: "APPLIED",
      sort: "FEED_COUNT_DESC",
      unmatchedFirst: 13,
      unmatchedAfter: "unmatched-current",
    }),
  );

  renderCJProgramsRoute();

  expect(screen.getByRole("link", { name: "First programs" })).toHaveAttribute(
    "href",
    "/ingestion/cj-programs?first=25&stage=applied&sort=feed_count_desc&unmatchedFirst=13&unmatchedAfter=unmatched-current",
  );
  expect(screen.getByRole("link", { name: "Next programs" })).toHaveAttribute(
    "href",
    "/ingestion/cj-programs?first=25&after=program-cursor-7&stage=applied&sort=feed_count_desc&unmatchedFirst=13&unmatchedAfter=unmatched-current",
  );
  expect(screen.getByRole("heading", { name: "Unmatched feeds" })).toBeInTheDocument();
  const unmatchedFeed = rowElementFor("Unmatched Outlet Feed");

  expect(within(unmatchedFeed).getByText("Provider feed ID unmatched-outlet")).toBeInTheDocument();
  expect(within(unmatchedFeed).getByText("Last seen Jul 20, 2026, 10:00 AM")).toBeInTheDocument();
  expect(within(unmatchedFeed).getByText("250 products")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "First unmatched feeds" })).toHaveAttribute(
    "href",
    "/ingestion/cj-programs?first=25&after=program-current&stage=applied&sort=feed_count_desc&unmatchedFirst=13",
  );
  expect(screen.getByRole("link", { name: "Next unmatched feeds" })).toHaveAttribute(
    "href",
    "/ingestion/cj-programs?first=25&after=program-current&stage=applied&sort=feed_count_desc&unmatchedFirst=13&unmatchedAfter=unmatched-cursor-next",
  );
});

test("CJ program lifecycle controls follow refreshed pagination after history navigation", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 20,
      after: null,
      stage: "SELECTED",
      sort: "FEED_COUNT_DESC",
      unmatchedFirst: 10,
      unmatchedAfter: null,
    }),
  );

  const view = renderCJProgramsRoute();

  expect(screen.getByRole("combobox", { name: "Stage" })).toHaveValue("selected");
  expect(screen.getByRole("combobox", { name: "Sort programs" })).toHaveValue("feed_count_desc");

  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 20,
      after: null,
      stage: "APPLIED",
      sort: "LAST_CHANGED_DESC",
      unmatchedFirst: 10,
      unmatchedAfter: null,
    }),
  );

  view.rerender(
    <MemoryRouter>
      <CJProgramsRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("combobox", { name: "Stage" })).toHaveValue("applied");
  expect(screen.getByRole("combobox", { name: "Sort programs" })).toHaveValue("last_changed_desc");
});

test("CJ programs route renders its unavailable state when the loader cannot authorize data", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    pagination: {
      first: 20,
      after: null,
      stage: null,
      sort: "NAME_ASC",
      unmatchedFirst: 10,
      unmatchedAfter: null,
    },
  } satisfies CJProgramsLoaderData);

  renderCJProgramsRoute();

  expect(screen.getByRole("heading", { name: "CJ programs" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("CJ programs unavailable.");
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

test("CJ programs route keeps an empty program and unmatched feed state factual", () => {
  mockedUsePreloadedQuery.mockReturnValue({
    ...buildCJProgramsData(),
    cjPrograms: {
      edges: [],
      pageInfo: { endCursor: null, hasNextPage: false, hasPreviousPage: false },
    },
    unmatchedCjFeeds: {
      edges: [],
      pageInfo: { endCursor: null, hasNextPage: false, hasPreviousPage: false },
    },
  });

  renderCJProgramsRoute();

  expect(screen.getByText("No CJ programs captured yet.")).toBeInTheDocument();
  expect(screen.getByText("No unmatched CJ feeds captured yet.")).toBeInTheDocument();
});

test("CJ programs route renders unavailable feedback for GraphQL payload failures", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Error("CJ program query returned GraphQL errors");
  });

  try {
    renderCJProgramsRoute();

    expect(screen.getByRole("alert")).toHaveTextContent("CJ programs unavailable.");
  } finally {
    consoleError.mockRestore();
  }
});

function renderCJProgramsRoute() {
  return render(
    <MemoryRouter>
      <CJProgramsRoute />
    </MemoryRouter>,
  );
}

function rowFor(name: string) {
  return within(rowElementFor(name));
}

function rowElementFor(name: string) {
  const row = screen.getByRole("heading", { name }).closest<HTMLElement>("tr, li");

  if (!row) {
    throw new Error(`Could not find row for ${name}.`);
  }

  return row;
}

function useInFlightMutationMock() {
  const [isInFlight, setIsInFlight] = useState(false);

  return [
    (config: unknown) => {
      setIsInFlight(true);
      commitUpdateMutationMock(config);
    },
    isInFlight,
  ] as const;
}

function buildReadyLoaderData(
  pagination: Extract<CJProgramsLoaderData, { status: "ready" }>["pagination"] = {
    first: 20,
    after: null,
    stage: null,
    sort: "NAME_ASC",
    unmatchedFirst: 10,
    unmatchedAfter: null,
  },
) {
  return {
    status: "ready",
    pagination,
    query: CJ_PROGRAMS_QUERY_DESCRIPTOR,
    unmatchedQuery: {
      ...UNMATCHED_FEEDS_QUERY_DESCRIPTOR,
      __relayQuery: {
        ...UNMATCHED_FEEDS_QUERY_DESCRIPTOR.__relayQuery,
        variables: { first: pagination.unmatchedFirst, after: pagination.unmatchedAfter },
      },
    },
  } satisfies CJProgramsLoaderData;
}

function buildCJProgramsData() {
  const stages = [
    ["NEW", "New"],
    ["CONSIDERING", "Considering"],
    ["SELECTED", "Selected"],
    ["APPLIED", "Applied"],
    ["ACCEPTED", "Accepted"],
    ["NOT_PURSUING", "Not pursuing"],
    ["DECLINED", "Declined"],
  ] as const;

  return {
    cjProgramStageCounts: {
      new: 1,
      considering: 1,
      selected: 1,
      applied: 1,
      accepted: 1,
      notPursuing: 1,
      declined: 1,
    },
    cjPrograms: {
      edges: stages.map(([stage, label], index) => ({
        cursor: `program-cursor-${index + 1}`,
        node: {
          id: `program-${index + 1}`,
          advertiserId: `advertiser-${index + 1}`,
          advertiserName: `${label} Merchant`,
          stage,
          note: null,
          lastChanged: "2026-07-20T10:00:00.000000Z",
          feedCount: 1,
          warningCodes:
            index === 0
              ? [
                  "MISSING_ADVERTISER_NAME",
                  "MISSING_PRODUCT_COUNT",
                  "NON_US_MARKET",
                  "NON_USD_CURRENCY",
                  "NON_ENGLISH_LANGUAGE",
                ]
              : [],
        },
      })),
      pageInfo: {
        endCursor: "program-cursor-7",
        hasNextPage: true,
        hasPreviousPage: true,
      },
    },
    unmatchedCjFeeds: {
      edges: [
        {
          cursor: "unmatched-cursor-next",
          node: {
            id: "unmatched-feed-1",
            provider: "CJ",
            providerFeedId: "unmatched-outlet",
            advertiserId: "unmatched-advertiser",
            advertiserName: "Unmatched Outlet",
            advertiserCountry: "US",
            sourceFeedType: "PRODUCT",
            currency: "USD",
            language: "EN",
            feedName: "Unmatched Outlet Feed",
            productCount: 250,
            providerLastUpdatedAt: "2026-07-20T09:00:00.000000Z",
            lastSeenAt: "2026-07-20T10:00:00.000000Z",
          },
        },
      ],
      pageInfo: {
        endCursor: "unmatched-cursor-next",
        hasNextPage: true,
        hasPreviousPage: true,
      },
    },
  };
}

function buildCJProgramFeedsData() {
  return {
    cjProgram: {
      id: "program-1",
      advertiserId: "advertiser-1",
      advertiserName: "New Merchant",
      stage: "NEW",
      note: null,
      lastChanged: "2026-07-20T10:00:00.000000Z",
      feedCount: 1,
      warningCodes: [],
      feeds: {
        edges: [
          {
            cursor: "feed-cursor-next",
            node: {
              id: "feed-1",
              provider: "CJ",
              providerFeedId: "trail-shopping",
              advertiserId: "advertiser-1",
              advertiserName: "New Merchant",
              advertiserCountry: "US",
              sourceFeedType: "PRODUCT",
              currency: "USD",
              language: "EN",
              feedName: "Trail Shopping",
              productCount: 5000,
              providerLastUpdatedAt: "2026-07-20T09:00:00.000000Z",
              lastSeenAt: "2026-07-20T10:00:00.000000Z",
            },
          },
        ],
        pageInfo: {
          endCursor: "feed-cursor-next",
          hasNextPage: true,
          hasPreviousPage: true,
        },
      },
    },
  };
}
