import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import {
  useFragment,
  usePaginationFragment,
  usePreloadedQuery,
  useRefetchableFragment,
} from "react-relay";
import { afterEach, expect, test, vi } from "vitest";
import type { ConversionIngestionSettings_ingestion$data } from "../../../../../src/__generated__/ConversionIngestionSettings_ingestion.graphql";
import type { ConversionIngestionStatus_query$data } from "../../../../../src/__generated__/ConversionIngestionStatus_query.graphql";
import { useRoutePreloadedQuery } from "../../../../../src/relay/route-preload";
import {
  ConversionIngestionRoute,
  type ConversionIngestionLoaderData,
} from "../../../../../src/routes/commerce/revenue/ingestion/ConversionIngestionRoute";

const {
  commitMutationMock,
  preloadRouteQueryMock,
  refetchMock,
  relayEnvironment,
  revalidateMock,
  useFragmentMock,
  useLoaderDataMock,
  usePaginationFragmentMock,
  usePreloadedQueryMock,
  useRefetchableFragmentMock,
  useRoutePreloadedQueryMock,
} = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  preloadRouteQueryMock: vi.fn(),
  refetchMock: vi.fn(),
  relayEnvironment: {},
  revalidateMock: vi.fn(),
  useFragmentMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  usePaginationFragmentMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRefetchableFragmentMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
    useRevalidator: () => ({ revalidate: revalidateMock }),
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useFragment: useFragmentMock,
    useMutation: () => [commitMutationMock, false],
    usePaginationFragment: usePaginationFragmentMock,
    usePreloadedQuery: usePreloadedQueryMock,
    useRefetchableFragment: useRefetchableFragmentMock,
    useRelayEnvironment: () => relayEnvironment,
  };
});

vi.mock("../../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../../src/relay/route-preload")>(
    "../../../../../src/relay/route-preload",
  );

  return {
    ...actual,
    preloadRouteQuery: preloadRouteQueryMock,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock,
  };
});

const mockedUseFragment = vi.mocked(useFragment);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePaginationFragment = vi.mocked(usePaginationFragment);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRefetchableFragment = vi.mocked(useRefetchableFragment);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

type IngestionFixture = Omit<
  Omit<ConversionIngestionStatus_query$data, " $fragmentType">["cjCommissionIngestion"],
  " $fragmentSpreads"
> &
  Omit<ConversionIngestionSettings_ingestion$data, " $fragmentType">;

const INGESTION = {
  activity: {
    attemptedAt: "2026-08-27T11:58:00Z",
    scheduledAt: "2026-08-27T12:05:00Z",
    state: "EXECUTING",
    windowEnd: "2026-08-27T12:00:00Z",
    windowStart: "2026-08-20T12:00:00Z",
  },
  credentials: { accountIdConfigured: true, apiTokenConfigured: true, ready: true },
  latestFailure: {
    errorSummary: "Provider timed out after the bounded request window.",
    finishedAt: "2026-08-26T12:05:00Z",
  },
  latestSuccess: { finishedAt: "2026-08-26T10:15:00Z", id: "run-success" },
  settings: {
    enabled: true,
    intervalMinutes: 1440,
    lookbackDays: 90,
    maxPages: 100,
    nextRunAt: "2026-08-28T10:15:00Z",
    updatedAt: "2026-08-26T10:20:00Z",
  },
} satisfies IngestionFixture;

const OVERVIEW = { cjCommissionIngestion: INGESTION };

const LATEST_FAILURE_RUN = {
  cursor: "cursor-1",
  errorSummary: "Provider timed out after the bounded request window.",
  finishedAt: "2026-08-26T12:05:00Z",
  id: "run-failure",
  pagesFetched: 3,
  recordsFailed: 1,
  recordsFetched: 20,
  recordsPersisted: 19,
  requesterEmail: "operator@example.test",
  startedAt: "2026-08-26T12:00:00Z",
  status: "FAILED",
  trigger: "SCHEDULED",
  windowEnd: "2026-08-26T12:00:00Z",
  windowStart: "2026-08-19T12:00:00Z",
};

const LATEST_SUCCESS_RUN = {
  cursor: "cursor-0",
  errorSummary: null,
  finishedAt: "2026-08-26T10:15:00Z",
  id: "run-success",
  pagesFetched: 4,
  recordsFailed: 0,
  recordsFetched: 20,
  recordsPersisted: 20,
  requesterEmail: "operator@example.test",
  startedAt: "2026-08-26T10:00:00Z",
  status: "SUCCEEDED",
  trigger: "OPERATOR",
  windowEnd: "2026-08-26T10:00:00Z",
  windowStart: "2026-08-19T10:00:00Z",
};

beforeEach(() => {
  commitMutationMock.mockReset();
  preloadRouteQueryMock.mockReset();
  refetchMock.mockReset();
  revalidateMock.mockReset();
  useFragmentMock.mockReset();
  useLoaderDataMock.mockReset();
  usePaginationFragmentMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRefetchableFragmentMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUseRoutePreloadedQuery.mockImplementation((_query, descriptor) => descriptor as never);
  mockedUsePreloadedQuery.mockReturnValue(OVERVIEW as never);
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  mockedUseRefetchableFragment.mockReturnValue([OVERVIEW, refetchMock] as never);
  mockedUsePaginationFragment.mockReturnValue({
    data: {
      cjCommissionSyncRuns: {
        edges: [
          { cursor: "cursor-1", node: LATEST_FAILURE_RUN },
          { cursor: "cursor-0", node: LATEST_SUCCESS_RUN },
        ],
        pageInfo: { endCursor: "cursor-0", hasNextPage: false },
      },
    },
    hasNext: false,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);
  preloadRouteQueryMock.mockResolvedValue({
    __relayQuery: {
      operationName: "ConversionSyncRunsQuery",
      text: "query ConversionSyncRunsQuery($first: Int!, $after: String) { cjCommissionSyncRuns(first: $first, after: $after) { edges { cursor } } }",
      variables: { after: null, first: 25 },
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});

test("conversion ingestion presents current activity timing, safe failure evidence, bounded settings, and a run ledger", async () => {
  renderConversionIngestionRoute();

  const status = screen.getByRole("region", { name: "Ingestion status" });
  expect(screen.getByRole("heading", { name: "Conversion ingestion" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Revenue reporting" })).toHaveAttribute(
    "href",
    "/commerce/revenue",
  );
  expect(status).toHaveTextContent("Next run");
  expect(status).toHaveTextContent("Window");
  expect(status).toHaveTextContent("Latest failure");
  expect(status).toHaveTextContent("Provider timed out after the bounded request window.");
  expect(within(status).getByText("Aug 27, 2026, 11:58 AM")).toHaveAttribute(
    "dateTime",
    "2026-08-27T11:58:00Z",
  );
  expect(within(status).getByText("Aug 20, 2026, 12:00 PM")).toHaveAttribute(
    "dateTime",
    "2026-08-20T12:00:00Z",
  );
  expect(within(status).getByText("Aug 26, 2026, 12:05 PM")).toHaveAttribute(
    "dateTime",
    "2026-08-26T12:05:00Z",
  );
  expect(screen.getByRole("form", { name: "Ingestion settings" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Run now" })).toBeEnabled();
  expect(await screen.findByRole("table", { name: "Conversion sync runs" })).toBeVisible();
  expect(screen.queryByText("secret-token")).not.toBeInTheDocument();
});

test("conversion ingestion focuses an invalid setting and retains bounded run-failure evidence", async () => {
  renderConversionIngestionRoute();

  const settings = screen.getByRole("form", { name: "Ingestion settings" });
  const interval = within(settings).getByLabelText("Interval minutes");
  fireEvent.change(interval, { target: { value: "14" } });
  fireEvent.submit(settings);

  expect(interval).toHaveFocus();
  expect(screen.getByRole("alert")).toHaveTextContent("Interval must be between 15 and 10080");
  fireEvent.click(await screen.findByRole("button", { name: "Show failure details" }));
  expect(screen.getAllByText("Provider timed out after the bounded request window.")).toHaveLength(
    2,
  );
});

test("active ingestion refetches its overview once per visible ten-second interval", () => {
  vi.useFakeTimers();
  renderConversionIngestionRoute();

  act(() => vi.advanceTimersByTime(10_000));

  expect(refetchMock).toHaveBeenCalledWith({}, { fetchPolicy: "network-only" });
});

test("settings submit preserves exact bounded values, disables while pending, and refreshes only the overview on success", async () => {
  renderConversionIngestionRoute();

  const settings = screen.getByRole("form", { name: "Ingestion settings" });
  const saveButton = within(settings).getByRole("button", { name: "Save settings" });
  fireEvent.click(saveButton);

  await waitFor(() =>
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: { enabled: true, intervalMinutes: 1440, lookbackDays: 90, maxPages: 100 },
        },
      }),
    ),
  );
  expect(saveButton).toBeDisabled();

  await completeMutation(0, {
    updateCjCommissionIngestionSettings: {
      errors: [],
      ingestion: { settings: { updatedAt: "2026-08-27T12:00:00Z" } },
    },
  });

  expect(await screen.findByRole("status")).toHaveTextContent("Settings saved.");
  expect(refetchMock).toHaveBeenCalledWith({}, { fetchPolicy: "network-only" });
  expect(revalidateMock).not.toHaveBeenCalled();
});

test("settings controls render the persisted overview values returned by the network-only refresh", () => {
  mockedUseRefetchableFragment.mockReturnValue([
    {
      ...OVERVIEW,
      cjCommissionIngestion: {
        ...INGESTION,
        settings: {
          ...INGESTION.settings,
          enabled: false,
          intervalMinutes: 720,
          lookbackDays: 14,
          maxPages: 12,
          updatedAt: "2026-08-27T12:00:00Z",
        },
      },
    },
    refetchMock,
  ] as never);
  renderConversionIngestionRoute();

  const settings = screen.getByRole("form", { name: "Ingestion settings" });
  expect(within(settings).getByRole("checkbox", { name: "Enable scheduled ingestion" })).not.toBeChecked();
  expect(within(settings).getByLabelText("Interval minutes")).toHaveValue(720);
  expect(within(settings).getByLabelText("Lookback days")).toHaveValue(14);
  expect(within(settings).getByLabelText("Maximum pages")).toHaveValue(12);
});

test("settings surface payload failures inline and focus the rejected field", async () => {
  renderConversionIngestionRoute();

  const settings = screen.getByRole("form", { name: "Ingestion settings" });
  fireEvent.click(within(settings).getByRole("button", { name: "Save settings" }));
  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));

  await completeMutation(0, {
    updateCjCommissionIngestionSettings: {
      errors: [{ field: "maxPages", message: "Maximum pages must stay bounded." }],
      ingestion: null,
    },
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("Maximum pages must stay bounded.");
  expect(within(settings).getByLabelText("Maximum pages")).toHaveFocus();
  expect(revalidateMock).not.toHaveBeenCalled();
});

test("run now is credentials-gated and deduplicates while its mutation is pending", async () => {
  mockSettingsIngestion({ ...INGESTION, credentials: { ...INGESTION.credentials, ready: false } });
  const gatedView = renderConversionIngestionRoute();

  const runNow = screen.getByRole("button", { name: "Run now" });
  expect(runNow).toBeDisabled();
  expect(screen.getByText("Credentials are required to run an import.")).toBeVisible();
  await screen.findByRole("table", { name: "Conversion sync runs" });
  gatedView.unmount();

  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  renderConversionIngestionRoute();
  const enabledRunNow = screen.getByRole("button", { name: "Run now" });
  fireEvent.click(enabledRunNow);
  fireEvent.click(enabledRunNow);

  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));
  expect(enabledRunNow).toBeDisabled();
});

test("run now refreshes only the overview after success and reports a sanitized payload error", async () => {
  renderConversionIngestionRoute();

  fireEvent.click(screen.getByRole("button", { name: "Run now" }));
  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));
  await completeMutation(0, {
    runCjCommissionIngestionNow: {
      errors: [],
      ingestion: { activity: { state: "SCHEDULED" } },
    },
  });
  await waitFor(() =>
    expect(refetchMock).toHaveBeenCalledWith({}, { fetchPolicy: "network-only" }),
  );
  expect(revalidateMock).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Run now" }));
  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(2));
  await completeMutation(1, {
    runCjCommissionIngestionNow: {
      errors: [{ field: null, message: "A run is already queued." }],
      ingestion: null,
    },
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("A run is already queued.");
  expect(revalidateMock).not.toHaveBeenCalled();
});

test("disabled schedules cannot be activated when credentials are missing", () => {
  mockSettingsIngestion({
    ...INGESTION,
    credentials: { ...INGESTION.credentials, ready: false },
    settings: { ...INGESTION.settings, enabled: false },
  });
  renderConversionIngestionRoute();

  expect(screen.getByRole("checkbox", { name: "Enable scheduled ingestion" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(
    screen.getByText("Credentials must be configured before this schedule can run."),
  ).toBeVisible();
});

test("disabled schedules cannot be activated before a successful CJ run", () => {
  mockSettingsIngestion({
    ...INGESTION,
    latestSuccess: null,
    settings: { ...INGESTION.settings, enabled: false },
  });
  renderConversionIngestionRoute();

  expect(screen.getByRole("checkbox", { name: "Enable scheduled ingestion" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(
    screen.getByText("A successful CJ run is required before scheduled ingestion can be enabled."),
  ).toBeVisible();
});

test("ready schedules can be activated after credentials and a successful CJ run", () => {
  mockSettingsIngestion({
    ...INGESTION,
    settings: { ...INGESTION.settings, enabled: false },
  });
  renderConversionIngestionRoute();

  expect(screen.getByRole("checkbox", { name: "Enable scheduled ingestion" })).toBeEnabled();
});

test("enabled schedules can always be disabled even when their credentials or success history are unavailable", async () => {
  mockSettingsIngestion({
    ...INGESTION,
    credentials: { ...INGESTION.credentials, ready: false },
    latestSuccess: null,
  });
  renderConversionIngestionRoute();

  const checkbox = screen.getByRole("checkbox", { name: "Enable scheduled ingestion" });
  expect(checkbox).toBeEnabled();
  fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

  await waitFor(() =>
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: { enabled: false, intervalMinutes: 1440, lookbackDays: 90, maxPages: 100 },
        },
      }),
    ),
  );
});

test("the deferred ledger retries history only while status and settings stay usable", async () => {
  const runsQuery = deferredPromise<ConversionIngestionLoaderData extends never ? never : object>();
  mockedUseLoaderData.mockReturnValue({
    ...buildReadyLoaderData(),
    runsQuery: runsQuery.promise,
  } as never);
  renderConversionIngestionRoute();

  await act(async () => runsQuery.reject(new Error("history unavailable")));

  expect(await screen.findByText("Conversion sync runs unavailable.")).toBeVisible();
  expect(screen.getByRole("region", { name: "Ingestion status" })).toBeVisible();
  expect(screen.getByRole("form", { name: "Ingestion settings" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Retry conversion sync runs" }));

  expect(await screen.findByRole("table", { name: "Conversion sync runs" })).toBeVisible();
  expect(preloadRouteQueryMock).toHaveBeenCalledWith(relayEnvironment, expect.anything(), {
    after: null,
    first: 25,
  });
  expect(revalidateMock).not.toHaveBeenCalled();
  expect(refetchMock).not.toHaveBeenCalled();
  expect(screen.getByRole("region", { name: "Ingestion status" })).toBeVisible();
  expect(screen.getByRole("form", { name: "Ingestion settings" })).toBeVisible();
});

test("the run ledger supports empty history and paginating more rows", async () => {
  const loadNext = vi.fn();
  mockedUsePaginationFragment.mockReturnValue({
    data: {
      cjCommissionSyncRuns: { edges: [], pageInfo: { endCursor: "cursor-0", hasNextPage: true } },
    },
    hasNext: true,
    isLoadingNext: false,
    loadNext,
  } as never);
  renderConversionIngestionRoute();

  expect(await screen.findByText("No conversion sync runs have been recorded.")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Load more runs" }));
  expect(loadNext).toHaveBeenCalledWith(
    25,
    expect.objectContaining({ onComplete: expect.anything() }),
  );
});

test.each([
  ["AVAILABLE", "Queued"],
  ["RETRYABLE", "Retrying"],
] as const)("%s activity polls through execution and refreshes history once on completion", (state, label) => {
  vi.useFakeTimers();
  mockedUseRefetchableFragment.mockReturnValue([
    { ...OVERVIEW, cjCommissionIngestion: withActivity(state) },
    refetchMock,
  ] as never);
  const view = renderConversionIngestionRoute();

  expect(screen.getByRole("region", { name: "Ingestion status" })).toHaveTextContent(label);
  act(() => vi.advanceTimersByTime(10_000));
  expect(refetchMock).toHaveBeenCalledTimes(1);
  expect(revalidateMock).not.toHaveBeenCalled();

  mockedUseRefetchableFragment.mockReturnValue([
    { ...OVERVIEW, cjCommissionIngestion: withActivity("EXECUTING") },
    refetchMock,
  ] as never);
  view.rerender(
    <MemoryRouter>
      <ConversionIngestionRoute />
    </MemoryRouter>,
  );
  expect(screen.getByRole("region", { name: "Ingestion status" })).toHaveTextContent("Running");
  act(() => vi.advanceTimersByTime(10_000));
  expect(refetchMock).toHaveBeenCalledTimes(2);
  expect(revalidateMock).not.toHaveBeenCalled();

  mockedUseRefetchableFragment.mockReturnValue([
    { ...OVERVIEW, cjCommissionIngestion: withActivity(null) },
    refetchMock,
  ] as never);
  view.rerender(
    <MemoryRouter>
      <ConversionIngestionRoute />
    </MemoryRouter>,
  );
  expect(revalidateMock).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(10_000));
  expect(refetchMock).toHaveBeenCalledTimes(2);

  view.rerender(
    <MemoryRouter>
      <ConversionIngestionRoute />
    </MemoryRouter>,
  );
  expect(revalidateMock).toHaveBeenCalledTimes(1);
  view.unmount();
});

test("status polling is visibility-gated and cleans up after unmount", () => {
  vi.useFakeTimers();
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  mockedUseRefetchableFragment.mockReturnValue([OVERVIEW, refetchMock] as never);
  const hiddenView = renderConversionIngestionRoute();
  act(() => vi.advanceTimersByTime(10_000));
  expect(refetchMock).not.toHaveBeenCalled();
  hiddenView.unmount();
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });

  const activeView = renderConversionIngestionRoute();
  activeView.unmount();
  act(() => vi.advanceTimersByTime(10_000));
  expect(refetchMock).not.toHaveBeenCalled();
});

function buildReadyLoaderData(): ConversionIngestionLoaderData {
  return {
    overviewQuery: {
      __relayQuery: {
        operationName: "ConversionIngestionRouteQuery",
        text: "query ConversionIngestionRouteQuery { cjCommissionIngestion { settings { enabled } } }",
        variables: {},
      },
    },
    runsQuery: Promise.resolve({
      __relayQuery: {
        operationName: "ConversionSyncRunsQuery",
        text: "query ConversionSyncRunsQuery($first: Int!, $after: String) { cjCommissionSyncRuns(first: $first, after: $after) { edges { cursor } } }",
        variables: { after: null, first: 25 },
      },
    }),
    runsVariables: { after: null, first: 25 },
    status: "ready",
  } as never;
}

function renderConversionIngestionRoute() {
  return render(
    <MemoryRouter>
      <ConversionIngestionRoute />
    </MemoryRouter>,
  );
}

async function completeMutation(index: number, response: object) {
  await act(async () => {
    commitMutationMock.mock.calls[index]?.[0]?.onCompleted(response, []);
  });
}

function deferredPromise<T>() {
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((_resolve, rejectPromise) => {
    reject = rejectPromise;
  });

  return { promise, reject };
}

function withActivity(state: "AVAILABLE" | "EXECUTING" | "RETRYABLE" | null) {
  return {
    ...INGESTION,
    activity: state ? { ...INGESTION.activity, state } : null,
  };
}

function mockSettingsIngestion(ingestion: IngestionFixture) {
  mockedUseFragment.mockReturnValue(ingestion as never);
}
