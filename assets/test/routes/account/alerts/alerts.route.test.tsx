import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Outlet,
  Route,
  RouterContextProvider,
  Routes,
  useLoaderData,
  useRevalidator,
} from "react-router";
import { useFragment, useMutation, usePreloadedQuery } from "react-relay";
import { AlertsRoute, alertsLoader } from "../../../../src/routes/account/alerts/AlertsRoute";
import { useRoutePreloadedQuery } from "../../../../src/relay/route-preload";
import { PriceWatchControl } from "../../../../src/routes/products/PriceWatchControl";

const {
  commitMutationMock,
  fetchRouteQueryMock,
  useFragmentMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRevalidatorMock,
  useRoutePreloadedQueryMock,
} = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  fetchRouteQueryMock: vi.fn(),
  useFragmentMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRevalidatorMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn(),
}));

vi.mock("../../../../src/relay/route-preload", () => ({
  fetchRouteQuery: fetchRouteQueryMock,
  getRelayEnvironmentFromRouterContext: vi.fn(() => ({})),
  useRoutePreloadedQuery: useRoutePreloadedQueryMock,
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useLoaderData: useLoaderDataMock, useRevalidator: useRevalidatorMock };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return {
    ...actual,
    useFragment: useFragmentMock,
    useMutation: useMutationMock,
    usePreloadedQuery: usePreloadedQueryMock,
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseFragment = vi.mocked(useFragment);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUseRevalidator = vi.mocked(useRevalidator);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

beforeEach(() => {
  commitMutationMock.mockReset();
  fetchRouteQueryMock.mockReset();
  mockedUseFragment.mockReset();
  mockedUseFragment.mockImplementation((_fragment, fragmentRef) => fragmentRef as never);
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  mockedUsePreloadedQuery.mockReset();
  useRevalidatorMock.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
  mockedUseMutation.mockReturnValue([commitMutationMock, false] as never);
  mockedUseRevalidator.mockReturnValue({ revalidate: vi.fn(), state: "idle" } as never);
});

test("alertsLoader preserves its Relay descriptor for component-owned fragments", async () => {
  const dispose = vi.fn();
  fetchRouteQueryMock.mockResolvedValue({
    data: {
      myAlertEvents: { edges: [], pageInfo: { hasNextPage: false } },
      myPriceWatches: { edges: [], pageInfo: { hasNextPage: false } },
    },
    descriptor: {
      __relayQuery: {
        cacheID: "AlertsRouteQuery-cache-id",
        operationName: "AlertsRouteQuery",
        variables: { first: 50 },
      },
    },
    dispose,
  });

  const request = new Request("https://product.test/account/alerts");
  const result = await alertsLoader({
    context: new RouterContextProvider(),
    params: {},
    pattern: "/account/alerts",
    request,
    url: new URL(request.url),
  });

  expect(result).toEqual({
    status: "ready",
    query: expect.objectContaining({
      __relayQuery: expect.objectContaining({ operationName: "AlertsRouteQuery" }),
    }),
  });
  expect(dispose).not.toHaveBeenCalled();
});

test("AlertsRoute presents unread changes before active watch controls", () => {
  mockReadyAlerts({
    status: "ready",
    alerts: [
      {
        id: "event-1",
        productName: "Display",
        productSlug: "display",
        merchantName: "Shop",
        ruleType: "TARGET_PRICE",
        currency: "USD",
        landedPrice: "90",
        observedAt: "2026-07-13T20:00:00Z",
        readAt: null,
      },
    ],
    watches: [
      {
        id: "watch-1",
        productName: "Display",
        productSlug: "display",
        merchantName: null,
        ruleType: "TARGET_PRICE",
        currency: "USD",
        targetAmount: "100",
        percentageDrop: null,
        baselineLandedPrice: "120",
        enabled: true,
      },
    ],
    hasMoreAlerts: false,
    hasMoreWatches: false,
  });

  render(
    <MemoryRouter>
      <AlertsRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Price alerts" })).toBeInTheDocument();
  expect(screen.getByRole("list", { name: "Price alert events" })).toHaveTextContent(
    "90 USD landed",
  );
  expect(screen.getByRole("list", { name: "Active price watches" })).toHaveTextContent(
    "Target 100 USD",
  );
  expect(screen.getByRole("button", { name: "Mark read" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
});

test("AlertsRoute keeps malformed observation sources visible instead of normalizing them", () => {
  mockReadyAlerts({
    status: "ready",
    alerts: [
      {
        id: "event-impossible",
        productName: "Impossible",
        productSlug: "impossible",
        merchantName: "Shop",
        ruleType: "TARGET_PRICE",
        currency: "USD",
        landedPrice: "90",
        observedAt: "2026-02-30T20:00:00Z",
        readAt: "2026-07-13T20:00:00Z",
      },
      {
        id: "event-offset-free",
        productName: "Offset free",
        productSlug: "offset-free",
        merchantName: "Shop",
        ruleType: "TARGET_PRICE",
        currency: "USD",
        landedPrice: "91",
        observedAt: "2026-07-13T20:00:00",
        readAt: "2026-07-13T20:00:00Z",
      },
      {
        id: "event-offset",
        productName: "Offset",
        productSlug: "offset",
        merchantName: "Shop",
        ruleType: "TARGET_PRICE",
        currency: "USD",
        landedPrice: "92",
        observedAt: "2026-07-13T00:30:00+02:00",
        readAt: "2026-07-13T20:00:00Z",
      },
    ],
    watches: [],
    hasMoreAlerts: false,
    hasMoreWatches: false,
  });

  render(
    <MemoryRouter>
      <AlertsRoute />
    </MemoryRouter>,
  );

  const list = screen.getByRole("list", { name: "Price alert events" });
  expect(list).toHaveTextContent("2026-02-30T20:00:00Z");
  expect(list).toHaveTextContent("2026-07-13T20:00:00");
  expect(list).toHaveTextContent("2026-07-13");
});

test("AlertsRoute encodes alert and watch product slugs in detail links", () => {
  mockReadyAlerts({
    status: "ready",
    alerts: [
      {
        id: "event-1",
        productName: "Alert Display",
        productSlug: "alert /+?",
        merchantName: "Shop",
        ruleType: "TARGET_PRICE",
        currency: "USD",
        landedPrice: "90",
        observedAt: "2026-07-13T20:00:00Z",
        readAt: null,
      },
    ],
    watches: [
      {
        id: "watch-1",
        productName: "Watch Display",
        productSlug: "watch /+?",
        merchantName: null,
        ruleType: "TARGET_PRICE",
        currency: "USD",
        targetAmount: "100",
        percentageDrop: null,
        baselineLandedPrice: "120",
        enabled: true,
      },
    ],
    hasMoreAlerts: false,
    hasMoreWatches: false,
  });

  render(
    <MemoryRouter>
      <AlertsRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "Alert Display" })).toHaveAttribute(
    "href",
    "/products/alert%20%2F%2B%3F",
  );
  expect(screen.getByRole("link", { name: "Watch Display" })).toHaveAttribute(
    "href",
    "/products/watch%20%2F%2B%3F",
  );
});

test("AlertsRoute keeps paused watches visible and resumes them", async () => {
  mockReadyAlerts({
    status: "ready",
    alerts: [],
    watches: [
      {
        id: "watch-paused",
        productName: "Display",
        productSlug: "display",
        merchantName: null,
        ruleType: "TARGET_PRICE",
        currency: "USD",
        targetAmount: "100",
        percentageDrop: null,
        baselineLandedPrice: "120",
        enabled: false,
      },
    ],
    hasMoreAlerts: false,
    hasMoreWatches: false,
  });

  render(
    <MemoryRouter>
      <AlertsRoute />
    </MemoryRouter>,
  );

  expect(screen.getByRole("list", { name: "Paused price watches" })).toHaveTextContent(
    "Target 100 USD",
  );
  fireEvent.click(screen.getByRole("button", { name: "Resume" }));

  await waitFor(() =>
    expect(commitMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { input: { id: "watch-paused", enabled: true } },
      }),
    ),
  );
});

test("mark-read pending and failure feedback stay on the affected alert row", async () => {
  mockReadyAlerts({
    status: "ready",
    alerts: [alertSummary("alert-one", "First alert"), alertSummary("alert-two", "Second alert")],
    watches: [],
    hasMoreAlerts: false,
    hasMoreWatches: false,
  });

  render(
    <MemoryRouter>
      <AlertsRoute />
    </MemoryRouter>,
  );

  const rows = within(screen.getByRole("list", { name: "Price alert events" })).getAllByRole(
    "listitem",
  );
  const firstButton = within(rows[0]).getByRole("button", { name: "Mark read" });
  const secondButton = within(rows[1]).getByRole("button", { name: "Mark read" });

  fireEvent.click(firstButton);

  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));
  expect(firstButton).toBeDisabled();
  expect(secondButton).not.toBeDisabled();

  await completeMutationAt(0, {
    markAlertRead: {
      event: null,
      errors: [
        { code: "INVALID_ARGUMENT", field: "id", message: "First alert could not be marked read." },
      ],
    },
  });

  expect(await within(rows[0]).findByRole("alert")).toHaveTextContent(
    "First alert could not be marked read.",
  );
  expect(within(rows[1]).queryByRole("alert")).not.toBeInTheDocument();
  expect(secondButton).not.toBeDisabled();
});

test("toggle pending and failure feedback stay on the affected watch row", async () => {
  mockReadyAlerts({
    status: "ready",
    alerts: [],
    watches: [watchSummary("watch-one", "First watch"), watchSummary("watch-two", "Second watch")],
    hasMoreAlerts: false,
    hasMoreWatches: false,
  });

  render(
    <MemoryRouter>
      <AlertsRoute />
    </MemoryRouter>,
  );

  const rows = within(screen.getByRole("list", { name: "Active price watches" })).getAllByRole(
    "listitem",
  );
  const firstButton = within(rows[0]).getByRole("button", { name: "Pause" });
  const secondButton = within(rows[1]).getByRole("button", { name: "Pause" });

  fireEvent.click(firstButton);

  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));
  expect(firstButton).toBeDisabled();
  expect(secondButton).not.toBeDisabled();

  await completeMutationAt(0, {
    updatePriceWatch: {
      watch: null,
      errors: [
        { code: "INVALID_ARGUMENT", field: "id", message: "First watch could not be paused." },
      ],
    },
  });

  expect(await within(rows[0]).findByRole("alert")).toHaveTextContent(
    "First watch could not be paused.",
  );
  expect(within(rows[1]).queryByRole("alert")).not.toBeInTheDocument();
  expect(secondButton).not.toBeDisabled();
});

test("delete pending and failure feedback stay on the affected watch row", async () => {
  mockReadyAlerts({
    status: "ready",
    alerts: [],
    watches: [watchSummary("watch-one", "First watch"), watchSummary("watch-two", "Second watch")],
    hasMoreAlerts: false,
    hasMoreWatches: false,
  });

  render(
    <MemoryRouter>
      <AlertsRoute />
    </MemoryRouter>,
  );

  const rows = within(screen.getByRole("list", { name: "Active price watches" })).getAllByRole(
    "listitem",
  );
  const firstButton = within(rows[0]).getByRole("button", { name: "Delete" });
  const secondButton = within(rows[1]).getByRole("button", { name: "Delete" });

  fireEvent.click(firstButton);

  expect(commitMutationMock).not.toHaveBeenCalled();
  const deleteDialog = screen.getByRole("alertdialog", { name: "Delete this price watch?" });
  expect(deleteDialog).toHaveTextContent(
    "Deleting the price watch for First watch permanently stops its alerts.",
  );
  fireEvent.click(within(deleteDialog).getByRole("button", { name: "Cancel" }));
  expect(commitMutationMock).not.toHaveBeenCalled();
  await waitFor(() => expect(firstButton).toHaveFocus());

  fireEvent.click(firstButton);
  fireEvent.click(
    within(screen.getByRole("alertdialog", { name: "Delete this price watch?" })).getByRole(
      "button",
      { name: "Delete price watch" },
    ),
  );

  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));
  expect(commitMutationMock).toHaveBeenCalledWith(
    expect.objectContaining({ variables: { id: "watch-one" } }),
  );
  expect(firstButton).toBeDisabled();
  expect(secondButton).not.toBeDisabled();

  await completeMutationAt(0, {
    deletePriceWatch: {
      deletedWatchId: null,
      errors: [
        { code: "INVALID_ARGUMENT", field: "id", message: "First watch could not be deleted." },
      ],
    },
  });

  expect(await within(rows[0]).findByRole("alert")).toHaveTextContent(
    "First watch could not be deleted.",
  );
  expect(within(rows[1]).queryByRole("alert")).not.toBeInTheDocument();
  expect(secondButton).not.toBeDisabled();
});

test("PriceWatchControl reveals relevant input and submits one typed rule", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Routes>
        <Route
          element={
            <Outlet
              context={{
                viewer: { id: "viewer-1", email: "person@example.com", isOperator: false },
              }}
            />
          }
        >
          <Route path="*" element={<PriceWatchControl productId="product-id" />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  const disclosure = screen.getByRole("button", { name: "Watch price or availability" });
  expect(disclosure).toHaveAttribute("data-slot", "collapsible-trigger");
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByLabelText("Target landed price")).not.toBeVisible();

  disclosure.focus();
  await user.keyboard("{Enter}");

  expect(disclosure).toHaveAttribute("aria-expanded", "true");
  expect(disclosure).toHaveFocus();
  expect(screen.getByLabelText("Target landed price")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Target landed price"), { target: { value: "75" } });

  await user.keyboard(" ");

  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByLabelText("Target landed price")).not.toBeVisible();
  expect(screen.getByLabelText("Target landed price")).toHaveValue("75");

  fireEvent.click(disclosure);

  expect(disclosure).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByLabelText("Target landed price")).toBeVisible();
  expect(screen.getByLabelText("Target landed price")).toHaveValue("75");
  fireEvent.click(screen.getByRole("button", { name: "Create watch" }));

  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));
  expect(commitMutationMock).toHaveBeenCalledWith(
    expect.objectContaining({
      variables: {
        input: {
          productId: "product-id",
          ruleType: "TARGET_PRICE",
          currency: "USD",
          targetAmount: "75",
        },
      },
    }),
  );

  await act(() => {
    commitMutationMock.mock.calls[0]?.[0]?.onCompleted(
      { createPriceWatch: { watch: { id: "watch-1" }, errors: [] } },
      [],
    );
  });

  expect(await screen.findByRole("status")).toHaveTextContent("Watch created");
});

test("PriceWatchControl resets all product-scoped form state when the product changes", () => {
  const view = render(
    <MemoryRouter>
      <PriceWatchControl productId="product-one" />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByText("Watch price or availability"));
  fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "EUR" } });
  fireEvent.change(screen.getByLabelText("Target landed price"), { target: { value: "75" } });

  view.rerender(
    <MemoryRouter>
      <PriceWatchControl productId="product-two" />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByText("Watch price or availability"));
  expect(screen.getByLabelText("Currency")).toHaveValue("USD");
  expect(screen.getByLabelText("Target landed price")).toHaveValue("");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

function mockReadyAlerts({
  alerts,
  watches,
  hasMoreAlerts,
  hasMoreWatches,
}: {
  status: "ready";
  alerts: ReturnType<typeof alertSummary>[];
  watches: ReturnType<typeof watchSummary>[];
  hasMoreAlerts: boolean;
  hasMoreWatches: boolean;
}) {
  const query = {
    __relayQuery: {
      cacheID: "AlertsRouteQuery-cache-id",
      operationName: "AlertsRouteQuery",
      variables: { first: 50 },
    },
  };
  mockedUseLoaderData.mockReturnValue({ status: "ready", query });
  mockedUsePreloadedQuery.mockReturnValue({
    myAlertEvents: {
      edges: alerts.map((node) => ({ node })),
      pageInfo: { hasNextPage: hasMoreAlerts },
    },
    myPriceWatches: {
      edges: watches.map((node) => ({ node })),
      pageInfo: { hasNextPage: hasMoreWatches },
    },
  } as never);
}

function alertSummary(
  id: string,
  productName: string,
): {
  id: string;
  productName: string;
  productSlug: string;
  merchantName: string;
  ruleType: string;
  currency: string;
  landedPrice: string;
  observedAt: string;
  readAt: string | null;
} {
  return {
    id,
    productName,
    productSlug: id,
    merchantName: "Shop",
    ruleType: "TARGET_PRICE",
    currency: "USD",
    landedPrice: "90",
    observedAt: "2026-07-13T20:00:00Z",
    readAt: null,
  };
}

function watchSummary(id: string, productName: string) {
  return {
    id,
    productName,
    productSlug: id,
    merchantName: null,
    ruleType: "TARGET_PRICE",
    currency: "USD",
    targetAmount: "100",
    percentageDrop: null,
    baselineLandedPrice: "120",
    enabled: true,
  };
}

async function completeMutationAt(index: number, payload: object) {
  await act(() => {
    commitMutationMock.mock.calls[index]?.[0]?.onCompleted(payload, []);
  });
}
