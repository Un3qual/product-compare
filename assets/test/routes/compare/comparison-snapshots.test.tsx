import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRelayEnvironment } from "../../../src/relay/environment";
import { createRelayRouterContext, fetchRouteQuery, useRoutePreloadedQuery } from "../../../src/relay/route-preload";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import { ShareComparisonControl } from "../../../src/routes/compare/ShareComparisonControl";
import { SharedComparisonRoute } from "../../../src/routes/compare/shared/SharedComparisonRoute";
import { sharedComparisonLoader } from "../../../src/routes/compare/shared/loader";
import publishComparisonSnapshotMutation from "../../../src/routes/compare/queries/PublishComparisonSnapshotMutation";
import revokeComparisonSnapshotMutation from "../../../src/routes/compare/queries/RevokeComparisonSnapshotMutation";

const {
  fetchRouteQueryMock,
  publishMutationMock,
  revokeMutationMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  fetchRouteQueryMock: vi.fn(),
  publishMutationMock: vi.fn(),
  revokeMutationMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>("../../../src/relay/route-preload");
  return { ...actual, fetchRouteQuery: fetchRouteQueryMock, useRoutePreloadedQuery: useRoutePreloadedQueryMock };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useLoaderData: useLoaderDataMock };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");
  return { ...actual, useMutation: useMutationMock, usePreloadedQuery: usePreloadedQueryMock };
});

const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

beforeEach(() => {
  fetchRouteQueryMock.mockReset();
  publishMutationMock.mockReset();
  revokeMutationMock.mockReset();
  useLoaderDataMock.mockReset();
  useMutationMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  mockedUseMutation.mockImplementation((mutation) =>
    (mutation === publishComparisonSnapshotMutation
      ? [publishMutationMock, false]
      : [revokeMutationMock, false]) as never
  );
});

test("ShareComparisonControl publishes the ordered products and selected profile", async () => {
  render(
    <MemoryRouter>
      <ShareComparisonControl
        products={[
          { id: "product-2", name: "Second", slug: "second", description: null, brandName: null, currentAttributes: [] },
          { id: "product-1", name: "First", slug: "first", description: null, brandName: null, currentAttributes: [] }
        ]}
        recommendation={{ profile: "best_value", algorithmVersion: "v1", status: "INSUFFICIENT_EVIDENCE", winnerProductId: null, currency: null, missingInputs: [], rankings: [] }}
      />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByText("Share a fixed comparison snapshot"));
  fireEvent.change(screen.getByLabelText("Optional title"), { target: { value: "Travel kit" } });
  fireEvent.click(screen.getByLabelText(/Allow search engines/));
  fireEvent.click(screen.getByRole("button", { name: "Publish snapshot" }));

  await waitFor(() => expect(publishMutationMock).toHaveBeenCalledTimes(1));
  expect(publishMutationMock).toHaveBeenCalledWith(expect.objectContaining({ variables: { input: { productIds: ["product-2", "product-1"], recommendationProfile: "BEST_VALUE", searchIndexable: true, title: "Travel kit" } } }));

  await act(async () => {
    publishMutationMock.mock.calls[0]?.[0]?.onCompleted({ publishComparisonSnapshot: { snapshot: { id: "snapshot-1" }, sharePath: "/compare/shared/public-token", errors: [] } }, []);
  });

  expect(await screen.findByRole("link", { name: "Travel kit" })).toHaveAttribute("href", "/compare/shared/public-token");
  expect(screen.getByRole("status")).toHaveTextContent("facts unchanged");
});

test("ShareComparisonControl revokes the just-published public link", async () => {
  render(<MemoryRouter><ShareComparisonControl products={[
    { id: "product-1", name: "First", slug: "first", description: null, brandName: null, currentAttributes: [] },
    { id: "product-2", name: "Second", slug: "second", description: null, brandName: null, currentAttributes: [] }
  ]} /></MemoryRouter>);
  fireEvent.click(screen.getByText("Share a fixed comparison snapshot"));
  fireEvent.click(screen.getByRole("button", { name: "Publish snapshot" }));
  await waitFor(() => expect(publishMutationMock).toHaveBeenCalled());
  await act(async () => publishMutationMock.mock.calls[0]?.[0]?.onCompleted({ publishComparisonSnapshot: { snapshot: { id: "snapshot-1" }, sharePath: "/compare/shared/token", errors: [] } }, []));
  fireEvent.click(await screen.findByRole("button", { name: "Revoke public link: Open public snapshot" }));
  await waitFor(() => expect(revokeMutationMock).toHaveBeenCalledWith(expect.objectContaining({ variables: { snapshotId: "snapshot-1" } })));
  await act(async () => revokeMutationMock.mock.calls[0]?.[0]?.onCompleted({ revokeComparisonSnapshot: { revokedSnapshotId: "snapshot-1", errors: [] } }, []));
  expect(await screen.findByRole("status")).toHaveTextContent("old link now returns not found");
  expect(screen.queryByRole("link", { name: "Open public snapshot" })).not.toBeInTheDocument();
});

test("ShareComparisonControl manages snapshots discovered after a reload", async () => {
  render(<MemoryRouter><ShareComparisonControl
    products={[
      { id: "product-1", name: "First", slug: "first", description: null, brandName: null, currentAttributes: [] },
      { id: "product-2", name: "Second", slug: "second", description: null, brandName: null, currentAttributes: [] }
    ]}
    publishedSnapshots={[{ id: "snapshot-existing", path: "/compare/shared/existing-token", title: "Existing shortlist" }]}
  /></MemoryRouter>);

  fireEvent.click(screen.getByText("Share a fixed comparison snapshot"));
  expect(screen.getByRole("link", { name: "Existing shortlist" })).toHaveAttribute("href", "/compare/shared/existing-token");
  fireEvent.click(screen.getByRole("button", { name: "Revoke public link: Existing shortlist" }));

  await waitFor(() => expect(revokeMutationMock).toHaveBeenCalledWith(expect.objectContaining({ variables: { snapshotId: "snapshot-existing" } })));
  await act(async () => revokeMutationMock.mock.calls[0]?.[0]?.onCompleted({ revokeComparisonSnapshot: { revokedSnapshotId: "snapshot-existing", errors: [] } }, []));
  expect(screen.queryByRole("link", { name: "Existing shortlist" })).not.toBeInTheDocument();
});

test("shared snapshot loader returns an HTTP 404 for invalid or revoked tokens", async () => {
  const environment = createRelayEnvironment();
  const invalid = await sharedComparisonLoader({ context: createRelayRouterContext(environment), params: { token: "short" }, request: new Request("https://example.test/compare/shared/short") } as never);
  expect(invalid).toMatchObject({ data: { status: "not_found" } });
  expect((invalid as { init: { status: number } }).init.status).toBe(404);
  expect(mockedFetchRouteQuery).not.toHaveBeenCalled();

  const dispose = vi.fn();
  mockedFetchRouteQuery.mockResolvedValueOnce({ data: { comparisonSnapshot: null }, descriptor: {}, dispose } as never);
  const token = "a".repeat(43);
  const revoked = await sharedComparisonLoader({ context: createRelayRouterContext(environment), params: { token }, request: new Request(`https://example.test/compare/shared/${token}`) } as never);
  expect(revoked).toMatchObject({ data: { status: "not_found" } });
  expect((revoked as { init: { status: number } }).init.status).toBe(404);
  expect(dispose).toHaveBeenCalledTimes(1);
});

test("SharedComparisonRoute renders captured facts, warning, and a live comparison path", () => {
  mockedUseLoaderData.mockReturnValue({ status: "ready", query: { __relayQuery: { operationName: "SharedComparisonRouteQuery", text: "query SharedComparisonRouteQuery { comparisonSnapshot(token: \"x\") { id } }", variables: { token: "x" } } } } as never);
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
  mockedUsePreloadedQuery.mockReturnValue({ comparisonSnapshot: {
    id: "snapshot-1", title: "Camera shortlist", capturedAt: "2026-07-13T23:00:00Z", disclaimer: "This is a captured snapshot.",
    recommendation: { profile: "LOWEST_CURRENT_COST", algorithmVersion: "lowest-v1", evaluatedAt: "2026-07-13T23:00:00Z", status: "WINNER", winnerProductId: "product-2", currency: "USD", missingInputs: [], rankings: [{ rank: 1, productId: "product-2", productName: "Second camera", landedPrice: "90", currency: "USD", pricePointId: "point-2", claimIds: [], reasons: ["Lowest current cost"] }] },
    products: [
      { id: "product-2", name: "Second camera", slug: "second-camera", description: null, modelNumber: null, brandName: "Acme", attributes: [], offers: [{ pricePointId: "point-2", merchantProductId: "offer-2", merchantName: "Shop", merchantDomain: "shop.example", currency: "USD", itemPrice: "85", shipping: "5", landedPrice: "90", observedAt: "2026-07-13T22:00:00Z", freshness: "fresh" }] },
      { id: "product-1", name: "First camera", slug: "first-camera", description: null, modelNumber: null, brandName: "Bravo", attributes: [], offers: [] }
    ]
  } } as never);

  render(<MemoryRouter><SharedComparisonRoute /></MemoryRouter>);
  expect(screen.getByRole("heading", { name: "Camera shortlist" })).toBeVisible();
  expect(screen.getByRole("note")).toHaveTextContent("captured snapshot");
  expect(screen.getByText("Second camera", { selector: "strong" })).toBeVisible();
  expect(screen.getByText(/Shop: 90 USD landed/)).toBeVisible();
  expect(screen.getByRole("link", { name: "Open a live comparison" })).toHaveAttribute("href", "/compare?slug=second-camera&slug=first-camera");
});
