import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import {
  useFragment,
  usePaginationFragment,
  usePreloadedQuery,
  useRefetchableFragment,
} from "react-relay";
import { afterEach, expect, test, vi } from "vitest";
import { useRoutePreloadedQuery } from "../../../../../src/relay/route-preload";
import {
  ConversionIngestionRoute,
  type ConversionIngestionLoaderData,
} from "../../../../../src/routes/commerce/revenue/ingestion/ConversionIngestionRoute";

const {
  commitMutationMock,
  refetchMock,
  revalidateMock,
  useFragmentMock,
  useLoaderDataMock,
  usePaginationFragmentMock,
  usePreloadedQueryMock,
  useRefetchableFragmentMock,
  useRoutePreloadedQueryMock,
} = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  refetchMock: vi.fn(),
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
  };
});

vi.mock("../../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../../src/relay/route-preload")>(
    "../../../../../src/relay/route-preload",
  );

  return { ...actual, useRoutePreloadedQuery: useRoutePreloadedQueryMock };
});

const mockedUseFragment = vi.mocked(useFragment);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePaginationFragment = vi.mocked(usePaginationFragment);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRefetchableFragment = vi.mocked(useRefetchableFragment);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const OVERVIEW = {
  cjCommissionIngestion: {
    activity: {
      attemptedAt: "2026-08-27T11:58:00Z",
      scheduledAt: "2026-08-27T12:05:00Z",
      state: "EXECUTING",
      windowEnd: "2026-08-27T12:00:00Z",
      windowStart: "2026-08-20T12:00:00Z",
    },
    credentials: { accountIdConfigured: true, apiTokenConfigured: true, ready: true },
    latestFailure: {
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
    },
    latestSuccess: {
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
    },
    settings: {
      enabled: true,
      intervalMinutes: 1440,
      lookbackDays: 90,
      maxPages: 100,
      nextRunAt: "2026-08-28T10:15:00Z",
      updatedAt: "2026-08-26T10:20:00Z",
      updatedByEmail: "operator@example.test",
    },
  },
};

beforeEach(() => {
  commitMutationMock.mockReset();
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
          { cursor: "cursor-1", node: OVERVIEW.cjCommissionIngestion.latestFailure },
          { cursor: "cursor-0", node: OVERVIEW.cjCommissionIngestion.latestSuccess },
        ],
        pageInfo: { endCursor: "cursor-0", hasNextPage: false },
      },
    },
    hasNext: false,
    isLoadingNext: false,
    loadNext: vi.fn(),
  } as never);
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});

test("conversion ingestion presents an operator status band, bounded settings, and run ledger", async () => {
  renderConversionIngestionRoute();

  expect(screen.getByRole("heading", { name: "Conversion ingestion" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Revenue reporting" })).toHaveAttribute(
    "href",
    "/commerce/revenue",
  );
  expect(screen.getByRole("region", { name: "Ingestion status" })).toHaveTextContent("Next run");
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
  expect(screen.getByText("Provider timed out after the bounded request window.")).toBeVisible();
});

test("active ingestion refetches its overview once per visible ten-second interval", () => {
  vi.useFakeTimers();
  renderConversionIngestionRoute();

  act(() => vi.advanceTimersByTime(10_000));

  expect(refetchMock).toHaveBeenCalledWith({}, { fetchPolicy: "network-only" });
});

test("settings submit preserves exact bounded values, disables while pending, and refreshes on success", async () => {
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
  expect(revalidateMock).toHaveBeenCalledTimes(1);
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
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => {
    const ingestion = fragmentRef as unknown as typeof OVERVIEW.cjCommissionIngestion;
    return { ...ingestion, credentials: { ...ingestion.credentials, ready: false } } as never;
  });
  renderConversionIngestionRoute();

  const runNow = screen.getByRole("button", { name: "Run now" });
  expect(runNow).toBeDisabled();
  expect(screen.getByText("Credentials are required to run an import.")).toBeVisible();

  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  renderConversionIngestionRoute();
  const enabledRunNow = screen.getAllByRole("button", { name: "Run now" })[1];
  fireEvent.click(enabledRunNow);
  fireEvent.click(enabledRunNow);

  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));
  expect(enabledRunNow).toBeDisabled();
});

test("run now refreshes after success and reports a sanitized payload error", async () => {
  renderConversionIngestionRoute();

  fireEvent.click(screen.getByRole("button", { name: "Run now" }));
  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));
  await completeMutation(0, {
    runCjCommissionIngestionNow: {
      errors: [],
      ingestion: { activity: { state: "SCHEDULED" } },
    },
  });
  await waitFor(() => expect(revalidateMock).toHaveBeenCalledTimes(1));

  fireEvent.click(screen.getByRole("button", { name: "Run now" }));
  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(2));
  await completeMutation(1, {
    runCjCommissionIngestionNow: {
      errors: [{ field: null, message: "A run is already queued." }],
      ingestion: null,
    },
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("A run is already queued.");
  expect(revalidateMock).toHaveBeenCalledTimes(1);
});

test("the deferred ledger keeps status and settings usable after history loading fails", async () => {
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

test("status polling stays idle or hidden, cleans up, and refreshes history once on terminal state", () => {
  vi.useFakeTimers();
  mockedUseRefetchableFragment.mockReturnValue([
    { ...OVERVIEW, cjCommissionIngestion: withActivity("AVAILABLE") },
    refetchMock,
  ] as never);
  const idleView = renderConversionIngestionRoute();
  act(() => vi.advanceTimersByTime(10_000));
  expect(refetchMock).not.toHaveBeenCalled();
  idleView.unmount();

  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  mockedUseRefetchableFragment.mockReturnValue([OVERVIEW, refetchMock] as never);
  const hiddenView = renderConversionIngestionRoute();
  act(() => vi.advanceTimersByTime(10_000));
  expect(refetchMock).not.toHaveBeenCalled();
  hiddenView.unmount();
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });

  const activeView = renderConversionIngestionRoute();
  activeView.rerender(
    <MemoryRouter>
      <ConversionIngestionRoute />
    </MemoryRouter>,
  );
  mockedUseRefetchableFragment.mockReturnValue([
    { ...OVERVIEW, cjCommissionIngestion: withActivity("AVAILABLE") },
    refetchMock,
  ] as never);
  activeView.rerender(
    <MemoryRouter>
      <ConversionIngestionRoute />
    </MemoryRouter>,
  );

  expect(revalidateMock).toHaveBeenCalledTimes(1);
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

function withActivity(state: "AVAILABLE" | "EXECUTING") {
  return {
    ...OVERVIEW.cjCommissionIngestion,
    activity: { ...OVERVIEW.cjCommissionIngestion.activity, state },
  };
}
