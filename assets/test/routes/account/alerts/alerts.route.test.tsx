import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLoaderData, useRevalidator } from "react-router-dom";
import { useMutation } from "react-relay";
import { AlertsRoute } from "../../../../src/routes/account/alerts/AlertsRoute";
import { summarizeAlertsRoute, type AlertsRouteLoaderData } from "../../../../src/routes/account/alerts/loader";
import { PriceWatchControl } from "../../../../src/routes/products/PriceWatchControl";

const { commitMutationMock, useLoaderDataMock, useMutationMock, useRevalidatorMock } = vi.hoisted(() => ({
  commitMutationMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  useRevalidatorMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useLoaderData: useLoaderDataMock, useRevalidator: useRevalidatorMock };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return { ...actual, useMutation: useMutationMock };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUseRevalidator = vi.mocked(useRevalidator);

beforeEach(() => {
  commitMutationMock.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  useRevalidatorMock.mockReset();
  mockedUseMutation.mockReturnValue([commitMutationMock, false] as never);
  mockedUseRevalidator.mockReturnValue({ revalidate: vi.fn(), state: "idle" } as never);
});

test("summarizeAlertsRoute keeps valid event and watch facts", () => {
  expect(summarizeAlertsRoute({
    myAlertEvents: {
      edges: [{ node: { id: "event-1", productName: "Display", productSlug: "display", merchantName: "Shop", ruleType: "TARGET_PRICE", currency: "USD", landedPrice: "90", observedAt: "2026-07-13T20:00:00Z", readAt: null } }],
      pageInfo: { hasNextPage: false }
    },
    myPriceWatches: {
      edges: [{ node: { id: "watch-1", productName: "Display", productSlug: "display", merchantName: null, ruleType: "TARGET_PRICE", currency: "USD", targetAmount: "100", percentageDrop: null, baselineLandedPrice: "120", enabled: true } }],
      pageInfo: { hasNextPage: true }
    }
  })).toMatchObject({
    alerts: [{ id: "event-1", landedPrice: "90" }],
    watches: [{ id: "watch-1", targetAmount: "100" }],
    hasMoreAlerts: false,
    hasMoreWatches: true
  });
});

test("AlertsRoute presents unread changes before active watch controls", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    alerts: [{ id: "event-1", productName: "Display", productSlug: "display", merchantName: "Shop", ruleType: "TARGET_PRICE", currency: "USD", landedPrice: "90", observedAt: "2026-07-13T20:00:00Z", readAt: null }],
    watches: [{ id: "watch-1", productName: "Display", productSlug: "display", merchantName: null, ruleType: "TARGET_PRICE", currency: "USD", targetAmount: "100", percentageDrop: null, baselineLandedPrice: "120", enabled: true }],
    hasMoreAlerts: false,
    hasMoreWatches: false,
    query: { __relayQuery: { operationName: "AlertsRouteQuery", text: "query AlertsRouteQuery { viewer { id } }", variables: { first: 50 } } }
  } satisfies AlertsRouteLoaderData);

  render(<MemoryRouter><AlertsRoute /></MemoryRouter>);

  expect(screen.getByRole("heading", { name: "Price alerts" })).toBeInTheDocument();
  expect(screen.getByRole("list", { name: "Price alert events" })).toHaveTextContent("90 USD landed");
  expect(screen.getByRole("list", { name: "Active price watches" })).toHaveTextContent("Target 100 USD");
  expect(screen.getByRole("button", { name: "Mark read" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
});

test("AlertsRoute keeps paused watches visible and resumes them", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    alerts: [],
    watches: [{ id: "watch-paused", productName: "Display", productSlug: "display", merchantName: null, ruleType: "TARGET_PRICE", currency: "USD", targetAmount: "100", percentageDrop: null, baselineLandedPrice: "120", enabled: false }],
    hasMoreAlerts: false,
    hasMoreWatches: false,
    query: { __relayQuery: { operationName: "AlertsRouteQuery", text: "query AlertsRouteQuery { viewer { id } }", variables: { first: 50 } } }
  } satisfies AlertsRouteLoaderData);

  render(<MemoryRouter><AlertsRoute /></MemoryRouter>);

  expect(screen.getByRole("list", { name: "Paused price watches" })).toHaveTextContent("Target 100 USD");
  fireEvent.click(screen.getByRole("button", { name: "Resume" }));

  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledWith(expect.objectContaining({
    variables: { input: { id: "watch-paused", enabled: true } }
  })));
});

test("PriceWatchControl reveals relevant input and submits one typed rule", async () => {
  render(<MemoryRouter><PriceWatchControl productId="product-id" /></MemoryRouter>);

  fireEvent.click(screen.getByText("Watch price or availability"));
  fireEvent.change(screen.getByLabelText("Target landed price"), { target: { value: "75" } });
  fireEvent.click(screen.getByRole("button", { name: "Create watch" }));

  await waitFor(() => expect(commitMutationMock).toHaveBeenCalledTimes(1));
  expect(commitMutationMock).toHaveBeenCalledWith(expect.objectContaining({
    variables: { input: { productId: "product-id", ruleType: "TARGET_PRICE", currency: "USD", targetAmount: "75" } }
  }));

  await act(async () => {
    commitMutationMock.mock.calls[0]?.[0]?.onCompleted({ createPriceWatch: { watch: { id: "watch-1" }, errors: [] } }, []);
  });

  expect(await screen.findByRole("status")).toHaveTextContent("Watch created");
});
