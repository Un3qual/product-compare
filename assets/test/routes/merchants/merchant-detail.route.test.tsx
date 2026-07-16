import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import { createRelayEnvironment } from "../../../src/relay/environment";
import { createRelayRouterContext, fetchRouteQuery, useRoutePreloadedQuery } from "../../../src/relay/route-preload";
import { MerchantDetailRoute } from "../../../src/routes/merchants/detail/MerchantDetailRoute";
import { merchantDetailLoader } from "../../../src/routes/merchants/detail/loader";

const { fetchRouteQueryMock, useLoaderDataMock, usePreloadedQueryMock, useRoutePreloadedQueryMock } = vi.hoisted(() => ({
  fetchRouteQueryMock: vi.fn(), useLoaderDataMock: vi.fn(), usePreloadedQueryMock: vi.fn(), useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>("../../../src/relay/route-preload");
  return { ...actual, fetchRouteQuery: fetchRouteQueryMock, useRoutePreloadedQuery: useRoutePreloadedQueryMock };
});
vi.mock("react-router-dom", async () => { const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom"); return { ...actual, useLoaderData: useLoaderDataMock }; });
vi.mock("react-relay", async () => { const actual = await vi.importActual<typeof import("react-relay")>("react-relay"); return { ...actual, usePreloadedQuery: usePreloadedQueryMock }; });

const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

beforeEach(() => { fetchRouteQueryMock.mockReset(); useLoaderDataMock.mockReset(); usePreloadedQueryMock.mockReset(); useRoutePreloadedQueryMock.mockReset(); });

test("merchant detail loader returns HTTP 404 for malformed and unknown slugs", async () => {
  const environment = createRelayEnvironment();
  const invalid = await merchantDetailLoader({ context: createRelayRouterContext(environment), params: { slug: "Bad Slug" }, request: new Request("https://example.test/merchants/Bad%20Slug") } as never);
  expect(invalid).toMatchObject({ data: { status: "not_found" } });
  expect((invalid as { init: { status: number } }).init.status).toBe(404);
  expect(mockedFetchRouteQuery).not.toHaveBeenCalled();
  const dispose = vi.fn();
  mockedFetchRouteQuery.mockResolvedValueOnce({ data: { merchant: null }, descriptor: {}, dispose } as never);
  const unknown = await merchantDetailLoader({ context: createRelayRouterContext(environment), params: { slug: "missing-12345678" }, request: new Request("https://example.test/merchants/missing-12345678") } as never);
  expect((unknown as { init: { status: number } }).init.status).toBe(404);
  expect(dispose).toHaveBeenCalled();
});

test("MerchantDetailRoute renders complete summary, safe destination, and product offer evidence", () => {
  mockedUseLoaderData.mockReturnValue({ status: "ready", query: { __relayQuery: { operationName: "MerchantDetailRouteQuery", text: "query MerchantDetailRouteQuery { merchant(slug: \"shop\") { id } }", variables: { slug: "shop", first: 20, after: null } } } } as never);
  mockedUseRoutePreloadedQuery.mockReturnValue({} as never);
  mockedUsePreloadedQuery.mockReturnValue({ merchant: {
    id: "merchant-1", name: "Trusted Shop", slug: "trusted-shop-12345678", domain: "trusted.example",
    detailSummary: { activeOfferCount: 2, distinctProductCount: 1, observedOfferCount: 1, eligibleOfferCount: 1, freshOfferCount: 1, agingOfferCount: 0, staleOfferCount: 0, unobservedOfferCount: 1, lastObservedAt: "2026-07-14T01:00:00Z" },
    merchantProducts: { edges: [{ node: { id: "offer-1", currency: "USD", product: { id: "product-1", name: "Field Camera", slug: "field-camera" }, latestPrice: { id: "price-1", price: "99", shipping: "4", inStock: true, observedAt: "2026-07-14T01:00:00Z" } } }], pageInfo: { hasNextPage: true, endCursor: "next + /?" } }
  } } as never);
  render(<MemoryRouter><MerchantDetailRoute /></MemoryRouter>);
  expect(screen.getByRole("heading", { name: "Trusted Shop" })).toBeVisible();
  expect(screen.getByLabelText("Merchant coverage")).toHaveTextContent("Eligible landed prices1");
  expect(screen.getByRole("link", { name: "Visit merchant website" })).toHaveAttribute("href", "https://trusted.example");
  expect(screen.getByRole("link", { name: "Field Camera" })).toHaveAttribute("href", "/products/field-camera");
  expect(screen.getByRole("link", { name: "Next offers" })).toHaveAttribute(
    "href",
    "/merchants/trusted-shop-12345678?after=next%20%2B%20%2F%3F"
  );
  expect(screen.getByText(/99 USD \+ 4 shipping · In stock/)).toBeVisible();
  expect(screen.getByText("Jul 14, 2026", { selector: "time" })).toHaveAttribute(
    "datetime",
    "2026-07-14T01:00:00Z"
  );
});
