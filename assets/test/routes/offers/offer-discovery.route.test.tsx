import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../src/relay/route-preload";
import { OfferDiscoveryRoute } from "../../../src/routes/offers/OfferDiscoveryRoute";
import { OfferDiscoveryCard } from "../../../src/routes/offers/OfferDiscoveryCard";
import type {
  ActiveCouponsConnection,
  OfferNode,
  PriceHistoryConnection
} from "../../../src/routes/offers/offer-discovery-data";
import type { OfferDiscoveryLoaderData } from "../../../src/routes/offers/loader";
import { resolveTrackedCommerceRedirectUrl } from "../../../src/routes/offers/TrackedCommerceClickAction";

const {
  commitCommerceClickMock,
  graphqlMock,
  useMutationMock,
  useLoaderDataMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitCommerceClickMock: vi.fn(),
  graphqlMock: vi.fn(),
  useMutationMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    graphql: graphqlMock,
    useMutation: useMutationMock,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload"
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);
const API_ORIGIN = "http://localhost:4000";
const SCRIPT_SCHEME_REDIRECT = ["java", "script:alert(1)"].join("");

const OFFER_DISCOVERY_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "OfferDiscoveryRouteQuery",
    text: "query OfferDiscoveryRouteQuery($input: MerchantProductsInput!, $productId: ID!) { selectedProduct: node(id: $productId) { __typename } merchantProducts(input: $input) { edges { node { id } } } }",
    variables: {
      productId: "UHJvZHVjdDoxMjM=",
      input: {
        activeOnly: true,
        first: 6,
        productId: "UHJvZHVjdDoxMjM="
      }
    }
  }
};

const OFFER_DISCOVERY_QUERY_REF = {
  dispose: vi.fn(),
  variables: OFFER_DISCOVERY_QUERY_DESCRIPTOR.__relayQuery.variables
};

beforeEach(() => {
  commitCommerceClickMock.mockReset();
  useMutationMock.mockReset();
  useLoaderDataMock.mockReset();
  usePreloadedQueryMock.mockReset();
  useRoutePreloadedQueryMock.mockReset();
  mockedUseMutation.mockReturnValue([commitCommerceClickMock, false] as never);
  OFFER_DISCOVERY_QUERY_REF.dispose.mockReset();
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());
  mockedUseRoutePreloadedQuery.mockReturnValue(OFFER_DISCOVERY_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildOfferDiscoveryData());
});

test("offer card directly renders tracked action, observations, price history, and coupon validity", () => {
  const offer = buildOfferDiscoveryData().merchantProducts.edges[0]?.node;

  if (!offer) {
    throw new Error("Expected the default offer fixture");
  }

  render(
    <MemoryRouter>
      <OfferDiscoveryCard highlightLabel="Best price on this page" offer={offer} />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Acme Market" })).toHaveAttribute(
    "href",
    `${API_ORIGIN}/r/merchant-product?merchantProductId=merchant-product-1`
  );
  expect(screen.getByText("Best price on this page")).toBeVisible();
  expect(screen.getByText("199.99 USD")).toBeVisible();
  expect(screen.getByText("2026-06-02", { selector: "time" }).parentElement).toHaveTextContent(
    "Offer checked 2026-06-02"
  );
  expect(screen.getByText("2026-05-30", { selector: "time" })).toBeVisible();
  expect(screen.getByText("189.99 USD")).toBeVisible();
  expect(screen.getByText("SAVE20")).toBeVisible();
  expect(screen.getByText("2026-06-30", { selector: "time" }).parentElement).toHaveTextContent(
    "Valid through 2026-06-30"
  );
});

test("offer discovery asks users to start from browse products when productId is missing", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "missingProduct",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: null,
      sort: "default"
    }
  } satisfies OfferDiscoveryLoaderData);

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("heading", { name: "Offers" })).toBeInTheDocument();
  expect(screen.getByText("Start from browse products to choose a product.")).toBeVisible();
  expect(screen.getByText("Choose a product to review its current merchant offers.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
    "href",
    "/products"
  );
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

test("offer discovery summarizes missing product filters without reset actions", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "missingProduct",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: null,
      sort: "default"
    }
  } satisfies OfferDiscoveryLoaderData);

  renderOfferDiscoveryRoute();

  const filterSummary = screen.getByRole("region", { name: "Active offer filters" });

  expect(within(filterSummary).getByText("Product ID")).toBeVisible();
  expect(within(filterSummary).getByText("Not selected")).toBeVisible();
  expect(within(filterSummary).getByText("Sort")).toBeVisible();
  expect(within(filterSummary).getByText("Default order")).toBeVisible();
  expect(within(filterSummary).queryByText("Merchant ID")).not.toBeInTheDocument();
  expect(
    within(filterSummary).queryByRole("link", { name: "Clear merchant filter" })
  ).not.toBeInTheDocument();
  expect(
    within(filterSummary).queryByRole("link", { name: "Reset filters" })
  ).not.toBeInTheDocument();
});

test("offer discovery renders filter controls with existing filter values", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 12,
      activeOnly: false,
      merchantId: "TWVyY2hhbnQ6NDU2",
      sort: "price_desc"
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("region", { name: "Offer results" })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Offer controls" })).toBeInTheDocument();

  const filterForm = screen.getByRole("form", { name: "Offer discovery filters" });

  expect(filterForm).toHaveAttribute("action", "/offers");
  expect(filterForm).toHaveAttribute("method", "get");
  expect(screen.getByRole("textbox", { name: "Product ID" })).toHaveValue(
    "UHJvZHVjdDoxMjM="
  );
  expect(screen.getByRole("textbox", { name: "Merchant ID" })).toHaveValue(
    "TWVyY2hhbnQ6NDU2"
  );
  expect(screen.getByRole("spinbutton", { name: "Page size" })).toHaveValue(12);
  expect(screen.getByRole("checkbox", { name: "Include inactive offers" })).toBeChecked();
  expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("price_desc");
});

test("offer discovery summarizes active filters", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      first: 12,
      activeOnly: false,
      merchantId: "TWVyY2hhbnQ6NDU2",
      sort: "merchant_name"
    })
  );

  renderOfferDiscoveryRoute();

  const filterSummary = screen.getByRole("region", { name: "Active offer filters" });

  expect(within(filterSummary).getByText("Product")).toBeVisible();
  expect(within(filterSummary).getByText("Detail Product")).toBeVisible();
  expect(within(filterSummary).getByText("Brand")).toBeVisible();
  expect(within(filterSummary).getByText("Example Brand")).toBeVisible();
  expect(within(filterSummary).getByRole("link", { name: "View product details" })).toHaveAttribute(
    "href",
    "/products/detail-product"
  );
  expect(within(filterSummary).queryByText("Product ID")).not.toBeInTheDocument();
  expect(within(filterSummary).queryByText("UHJvZHVjdDoxMjM=")).not.toBeInTheDocument();
  expect(within(filterSummary).getByText("Merchant ID")).toBeVisible();
  expect(within(filterSummary).getByText("TWVyY2hhbnQ6NDU2")).toBeVisible();
  expect(within(filterSummary).getByText("Offer status")).toBeVisible();
  expect(within(filterSummary).getByText("All offers included")).toBeVisible();
  expect(within(filterSummary).getByText("Page size")).toBeVisible();
  expect(within(filterSummary).getByText("12")).toBeVisible();
  expect(within(filterSummary).getByText("Sort")).toBeVisible();
  expect(within(filterSummary).getByText("Merchant name")).toBeVisible();
});

test("offer discovery omits merchant summary actions when no merchant filter is active", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData());

  renderOfferDiscoveryRoute();

  const filterSummary = screen.getByRole("region", { name: "Active offer filters" });

  expect(within(filterSummary).getByText("Detail Product")).toBeVisible();
  expect(within(filterSummary).getByText("Example Brand")).toBeVisible();
  expect(within(filterSummary).queryByText("Merchant ID")).not.toBeInTheDocument();
  expect(within(filterSummary).getByRole("link", { name: "Reset filters" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D"
  );
  expect(
    within(filterSummary).queryByRole("link", { name: "Clear merchant filter" })
  ).not.toBeInTheDocument();
});

test("offer discovery provides route-local filter reset links", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      after: "cursor-1",
      first: 12,
      activeOnly: false,
      merchantId: "TWVyY2hhbnQ6NDU2",
      sort: "price_asc"
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("link", { name: "Reset filters" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D&sort=price_asc"
  );
  expect(screen.getByRole("link", { name: "Clear merchant filter" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D&activeOnly=false&first=12&sort=price_asc"
  );
});

test("offer discovery refreshes uncontrolled filter controls when filters change", () => {
  const { rerender } = renderOfferDiscoveryRoute();

  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      activeOnly: false,
      first: 24,
      merchantId: "TWVyY2hhbnQ6NDU2",
      productId: "UHJvZHVjdDo5OTk=",
      sort: "merchant_name"
    })
  );

  rerender(
    <MemoryRouter>
      <OfferDiscoveryRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("textbox", { name: "Product ID" })).toHaveValue(
    "UHJvZHVjdDo5OTk="
  );
  expect(screen.getByRole("textbox", { name: "Merchant ID" })).toHaveValue(
    "TWVyY2hhbnQ6NDU2"
  );
  expect(screen.getByRole("spinbutton", { name: "Page size" })).toHaveValue(24);
  expect(screen.getByRole("checkbox", { name: "Include inactive offers" })).toBeChecked();
  expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("merchant_name");
});

test("offer discovery renders ready offer rows", () => {
  renderOfferDiscoveryRoute();

  expect(screen.getByRole("heading", { name: "Offers" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Offers" })).toBeInTheDocument();
  expect(screen.getByText("Active offers")).toBeVisible();

  const offer = screen.getByRole("heading", { name: "Detail Product" }).closest("li");

  expect(offer).not.toBeNull();

  const offerContent = within(offer as HTMLElement);

  expect(offerContent.getByRole("heading", { name: "Detail Product" })).toBeVisible();
  expect(offerContent.getByRole("link", { name: "Acme Market" })).toHaveAttribute(
    "href",
    `${API_ORIGIN}/r/merchant-product?merchantProductId=merchant-product-1`
  );
  expect(offerContent.getByText("acme.example")).toBeVisible();
  expect(offerContent.getByText("Active")).toBeVisible();
  expect(offerContent.getByText("199.99 USD")).toBeVisible();
  const offerCheckedAt = offerContent.getByText("2026-06-02", { selector: "time" });
  const priceObservedAt = offerContent.getByText("2026-06-01", { selector: "time" });
  const couponValidTo = offerContent.getByText("2026-06-30", { selector: "time" });

  expect(offerCheckedAt).toHaveAttribute("datetime", "2026-06-02T12:00:00Z");
  expect(offerCheckedAt.parentElement).toHaveTextContent("Offer checked 2026-06-02");
  expect(priceObservedAt).toHaveAttribute("datetime", "2026-06-01T00:00:00Z");
  expect(priceObservedAt.parentElement).toHaveTextContent("Price observed 2026-06-01");
  expect(offerContent.getByText("SAVE20")).toBeVisible();
  expect(offerContent.getByText("20.00 USD")).toBeVisible();
  expect(couponValidTo).toHaveAttribute("datetime", "2026-06-30T23:59:59Z");
  expect(couponValidTo.parentElement).toHaveTextContent("Valid through 2026-06-30");
  expect(offerContent.getByText("2026-05-30")).toBeVisible();
  expect(offerContent.getByText("189.99 USD")).toBeVisible();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    OFFER_DISCOVERY_QUERY_DESCRIPTOR
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    OFFER_DISCOVERY_QUERY_REF
  );
});

test("offer discovery omits unsafe observation and coupon validity claims", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          lastSeenAt: 1_717_326_000_000,
          latestPrice: {
            id: "price-invalid-date",
            price: "199.99",
            observedAt: "2026-02-30T00:00:00Z"
          },
          activeCoupons: buildCouponConnection([
            {
              cursor: "coupon-invalid-date",
              node: {
                code: "SAVE20",
                description: "Save on the detail product.",
                discountType: "AMOUNT",
                discountValue: "20.00",
                currency: "USD",
                validTo: "June 30 2026",
                terms: "Online orders only."
              }
            }
          ])
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  const offer = screen.getByRole("heading", { name: "Detail Product" }).closest("li");

  expect(offer).not.toBeNull();
  const offerContent = within(offer as HTMLElement);

  expect(offerContent.getByText("199.99 USD")).toBeVisible();
  expect(offerContent.getByText("SAVE20")).toBeVisible();
  expect(offerContent.queryByText(/^Offer checked/)).not.toBeInTheDocument();
  expect(offerContent.queryByText(/^Price observed/)).not.toBeInTheDocument();
  expect(offerContent.queryByText(/^Valid through/)).not.toBeInTheDocument();
});

test("offer discovery keeps offer actions when merchant metadata is unavailable", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        {
          id: "merchant-product-without-merchant",
          url: "https://merchant.example.com/no-merchant-offer",
          currency: "USD",
          lastSeenAt: null,
          isActive: true,
          merchant: null,
          product: {
            id: "product-1",
            name: "Detail Product",
            slug: "detail-product"
          },
          latestPrice: null,
          activeCoupons: buildCouponConnection([]),
          priceHistory: buildPriceHistoryConnection([])
        }
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("link", { name: "Visit offer" })).toHaveAttribute(
    "href",
    `${API_ORIGIN}/r/merchant-product?merchantProductId=merchant-product-without-merchant`
  );
  expect(screen.queryByText("acme.example")).not.toBeInTheDocument();
});

test("offer discovery tracks merchant clicks with only the merchant product ID", () => {
  renderOfferDiscoveryRoute();

  fireEvent.click(screen.getByRole("link", { name: "Acme Market" }));

  expect(commitCommerceClickMock).toHaveBeenCalledWith(
    expect.objectContaining({
      variables: {
        input: {
          merchantProductId: "merchant-product-1"
        }
      }
    })
  );
  expect(JSON.stringify(commitCommerceClickMock.mock.calls[0]?.[0]?.variables)).not.toContain(
    "https://merchant.example.com/detail-product"
  );
});

test("offer discovery resolves tracked redirects against the API origin", () => {
  expect(
    resolveTrackedCommerceRedirectUrl(
      "/r/click-123?merchantProductId=merchant-product-1",
      "http://localhost:4000/api/graphql"
    )
  ).toBe("http://localhost:4000/r/click-123?merchantProductId=merchant-product-1");
});

test("offer discovery rejects tracked redirects outside the API origin", () => {
  expect(() =>
    resolveTrackedCommerceRedirectUrl(
      "https://attacker.example/r/click-123",
      "http://localhost:4000/api/graphql"
    )
  ).toThrow("same origin");

  expect(() =>
    resolveTrackedCommerceRedirectUrl(
      "//attacker.example/r/click-123",
      "http://localhost:4000/api/graphql"
    )
  ).toThrow("same origin");

  expect(() =>
    resolveTrackedCommerceRedirectUrl(SCRIPT_SCHEME_REDIRECT, "http://localhost:4000/api/graphql")
  ).toThrow("same origin");
});

test("offer discovery blocks pending tracked merchant action re-clicks", () => {
  mockedUseMutation.mockReturnValue([commitCommerceClickMock, true] as never);

  renderOfferDiscoveryRoute();

  const merchantLink = screen.getByRole("link", { name: "Acme Market" });
  const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });

  expect(merchantLink).toHaveAttribute("aria-disabled", "true");

  fireEvent(merchantLink, clickEvent);

  expect(clickEvent.defaultPrevented).toBe(true);
  expect(commitCommerceClickMock).not.toHaveBeenCalled();
});

test("offer discovery keeps active All offers rows on tracked merchant actions", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ activeOnly: false }));
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-active",
          url: "https://merchant.example.com/active-offer",
          isActive: true,
          merchant: buildMerchant("merchant-active", "Active Market")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  const merchantLink = screen.getByRole("link", { name: "Active Market" });

  expect(screen.getByText("All offers")).toBeVisible();
  expect(merchantLink).toHaveAttribute(
    "href",
    `${API_ORIGIN}/r/merchant-product?merchantProductId=merchant-product-active`
  );

  fireEvent.click(merchantLink);

  expect(commitCommerceClickMock).toHaveBeenCalledWith(
    expect.objectContaining({
      variables: {
        input: {
          merchantProductId: "merchant-product-active"
        }
      }
    })
  );
});

test("offer discovery renders inactive All offers rows as safe direct merchant links", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ activeOnly: false }));
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-inactive",
          url: "https://merchant.example.com/inactive-offer",
          isActive: false,
          merchant: buildMerchant("merchant-inactive", "Inactive Market")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  const merchantLink = screen.getByRole("link", { name: "Inactive Market" });

  expect(screen.getByText("All offers")).toBeVisible();
  expect(screen.getByText("Inactive")).toBeVisible();
  expect(merchantLink).toHaveAttribute(
    "href",
    "https://merchant.example.com/inactive-offer"
  );

  merchantLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
  fireEvent.click(merchantLink);

  expect(commitCommerceClickMock).not.toHaveBeenCalled();
});

test("offer discovery renders tracked click errors without nested paragraph markup", () => {
  commitCommerceClickMock.mockImplementation(({ onCompleted }) => {
    onCompleted(
      {
        trackCommerceClick: {
          redirectPath: null,
          errors: [
            {
              code: "INVALID_ARGUMENT",
              field: null,
              message: "Offer unavailable."
            }
          ]
        }
      },
      null
    );
  });

  renderOfferDiscoveryRoute();
  fireEvent.click(screen.getByRole("link", { name: "Acme Market" }));

  const alert = screen.getByRole("alert");

  expect(alert).toHaveTextContent("Offer unavailable.");
  expect(alert.parentElement?.tagName).not.toBe("P");
});

test.each([
  ["URL credentials", "https://trusted.example@attacker.example/deals"],
  ["malformed HTTP authority", "https:////attacker.example/deals"],
  ["invalid host labels", "https://bad_domain.example/deals"],
  ["localhost URL", "http://localhost/deals"],
  ["private network URL", "http://192.168.1.1/deals"],
  ["IPv4-mapped private IPv6 URL", "http://[::ffff:192.168.1.1]/deals"],
  ["IPv4-compatible loopback IPv6 URL", "http://[::127.0.0.1]/deals"],
  ["single-slash HTTP URL", "https:/merchant.example/deals"],
  ["non-HTTP scheme", "ftp://files.example/deals"]
])("offer discovery drops offer links with %s", (_caseName, url) => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "unsafe-offer",
          url,
          merchant: buildMerchant("unsafe-merchant", "Unsafe Market")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByText("No offers match these filters.")).toBeVisible();
  expect(screen.queryByRole("link", { name: "Unsafe Market" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Filter to Unsafe Market" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Visible offer snapshot" })).not.toBeInTheDocument();
});

test("offer discovery exposes row merchant filter actions that preserve filters and drop cursors", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      activeOnly: false,
      after: "stale-cursor",
      first: 12,
      sort: "price_asc"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-acme",
          merchant: buildMerchant("TWVyY2hhbnQ6NDU2", "Acme Market")
        }),
        buildOffer({
          id: "merchant-product-value",
          merchant: buildMerchant("TWVyY2hhbnQ6Nzg5", "Value Mart")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("link", { name: "Filter to Acme Market" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D&merchantId=TWVyY2hhbnQ6NDU2&activeOnly=false&first=12&sort=price_asc"
  );
  expect(screen.getByRole("link", { name: "Filter to Value Mart" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D&merchantId=TWVyY2hhbnQ6Nzg5&activeOnly=false&first=12&sort=price_asc"
  );
});

test("offer discovery de-duplicates visible merchant filters by merchant id", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-acme-1",
          merchant: buildMerchant("TWVyY2hhbnQ6NDU2", "Acme Market")
        }),
        buildOffer({
          id: "merchant-product-acme-2",
          merchant: buildMerchant("TWVyY2hhbnQ6NDU2", "Acme Market")
        }),
        buildOffer({
          id: "merchant-product-value",
          merchant: buildMerchant("TWVyY2hhbnQ6Nzg5", "Value Mart")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getAllByRole("link", { name: "Filter to Acme Market" })).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Filter to Value Mart" })).toBeVisible();
});

test("offer discovery omits merchant filters with missing display names", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-empty-name",
          merchant: { ...buildMerchant("merchant-empty", "Empty Merchant"), name: "" }
        }),
        buildOffer({
          id: "merchant-product-null-merchant",
          merchant: null
        }),
        buildOffer({
          id: "merchant-product-value",
          merchant: buildMerchant("merchant-value", "Value Mart")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.queryByRole("link", { name: /^Filter to $/ })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Filter to Value Mart" })).toBeVisible();
});

test("offer discovery summarizes the active merchant filter with visible merchant names", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      merchantId: "TWVyY2hhbnQ6NDU2"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-acme",
          merchant: buildMerchant("TWVyY2hhbnQ6NDU2", "Acme Market")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByText("Filtered to Acme Market")).toBeVisible();
  expect(screen.queryByRole("link", { name: "Filter to Acme Market" })).not.toBeInTheDocument();
});

test("offer discovery keeps visible merchant actions when active merchant is absent", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      merchantId: "merchant-missing"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-acme",
          merchant: buildMerchant("merchant-acme", "Acme Market")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.queryByText(/^Filtered to /)).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Filter to Acme Market" })).toBeVisible();
});

test("offer discovery sorts visible offers by ascending price and labels the first numeric result", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ sort: "price_asc" }));
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-expensive",
          product: buildProduct("product-expensive", "Expensive Product"),
          merchant: buildMerchant("merchant-expensive", "Zephyr Market"),
          latestPrice: buildLatestPrice("price-expensive", "299.00")
        }),
        buildOffer({
          id: "merchant-product-no-price",
          product: buildProduct("product-no-price", "No Price Product"),
          merchant: buildMerchant("merchant-no-price", "Middle Market"),
          latestPrice: null
        }),
        buildOffer({
          id: "merchant-product-budget",
          product: buildProduct("product-budget", "Budget Product"),
          merchant: buildMerchant("merchant-budget", "Alpha Market"),
          latestPrice: buildLatestPrice("price-budget", "129.00")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(offerHeadings()).toEqual([
    "Budget Product",
    "Expensive Product",
    "No Price Product"
  ]);

  const bestOffer = screen.getByRole("heading", { name: "Budget Product" }).closest("li");

  expect(bestOffer).not.toBeNull();
  expect(within(bestOffer as HTMLElement).getByText("Best price on this page")).toBeVisible();
  expect(screen.getAllByText("Best price on this page")).toHaveLength(1);
});

test("offer discovery does not price-sort or label mixed-currency pages", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ sort: "price_asc" }));
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-usd",
          product: buildProduct("product-usd", "USD Product"),
          merchant: buildMerchant("merchant-usd", "USD Market"),
          latestPrice: buildLatestPrice("price-usd", "199.00"),
          currency: "USD"
        }),
        buildOffer({
          id: "merchant-product-eur",
          product: buildProduct("product-eur", "EUR Product"),
          merchant: buildMerchant("merchant-eur", "Euro Market"),
          latestPrice: buildLatestPrice("price-eur", "149.00"),
          currency: "EUR"
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(offerHeadings()).toEqual(["USD Product", "EUR Product"]);
  expect(screen.queryByText("Best price on this page")).not.toBeInTheDocument();
  expect(screen.queryByText("Highest price on this page")).not.toBeInTheDocument();
});

test("offer discovery sorts visible offers by descending price", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ sort: "price_desc" }));
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-budget",
          product: buildProduct("product-budget", "Budget Product"),
          merchant: buildMerchant("merchant-budget", "Alpha Market"),
          latestPrice: buildLatestPrice("price-budget", "129.00")
        }),
        buildOffer({
          id: "merchant-product-expensive",
          product: buildProduct("product-expensive", "Expensive Product"),
          merchant: buildMerchant("merchant-expensive", "Zephyr Market"),
          latestPrice: buildLatestPrice("price-expensive", "299.00")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(offerHeadings()).toEqual(["Expensive Product", "Budget Product"]);
  expect(screen.getByText("Highest price on this page")).toBeVisible();
  expect(screen.queryByText("Best price on this page")).not.toBeInTheDocument();
});

test("offer discovery sorts visible offers by merchant name without price labels", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyLoaderData({ sort: "merchant_name" }));
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-zephyr",
          product: buildProduct("product-zephyr", "Zephyr Product"),
          merchant: buildMerchant("merchant-zephyr", "Zephyr Market")
        }),
        buildOffer({
          id: "merchant-product-alpha",
          product: buildProduct("product-alpha", "Alpha Product"),
          merchant: buildMerchant("merchant-alpha", "Alpha Market")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(offerHeadings()).toEqual(["Alpha Product", "Zephyr Product"]);
  expect(screen.queryByText("Best price on this page")).not.toBeInTheDocument();
});

test("offer discovery summarizes the visible single-currency offer page", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-expensive",
          product: buildProduct("product-expensive", "Expensive Product"),
          merchant: buildMerchant("merchant-expensive", "Zephyr Market"),
          latestPrice: buildLatestPrice("price-expensive", "299.00")
        }),
        buildOffer({
          id: "merchant-product-budget",
          product: buildProduct("product-budget", "Budget Product"),
          merchant: buildMerchant("merchant-budget", "Alpha Market"),
          latestPrice: buildLatestPrice("price-budget", "129.00"),
          activeCoupons: buildCouponConnection([
            {
              cursor: "coupon-budget",
              node: {
                code: "SAVE10",
                description: "Save on the budget offer.",
                discountType: "PERCENT",
                discountValue: "10",
                currency: null,
                validTo: null,
                terms: null
              }
            }
          ])
        }),
        buildOffer({
          id: "merchant-product-no-price-1",
          product: buildProduct("product-no-price-1", "No Price Product One"),
          merchant: buildMerchant("merchant-no-price-1", "No Price Market One"),
          latestPrice: null
        }),
        buildOffer({
          id: "merchant-product-no-price-2",
          product: buildProduct("product-no-price-2", "No Price Product Two"),
          merchant: buildMerchant("merchant-no-price-2", "No Price Market Two"),
          latestPrice: null
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  const snapshot = screen.getByRole("region", { name: "Visible offer snapshot" });
  const offersList = screen.getByRole("list", { name: "Offers" });

  expect(
    within(snapshot).getByRole("heading", { level: 2, name: "Visible offer snapshot" })
  ).toBeVisible();
  expect(
    snapshot.compareDocumentPosition(offersList) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(within(snapshot).getByText("Visible offers on this page")).toBeVisible();
  expect(within(snapshot).getByText("4")).toBeVisible();
  expect(within(snapshot).getByText("Lowest visible price")).toBeVisible();
  expect(within(snapshot).getByText("129.00 USD")).toBeVisible();
  expect(within(snapshot).getByText("Visible coupon availability")).toBeVisible();
  expect(within(snapshot).getByText("1 offer with coupons")).toBeVisible();
  expect(within(snapshot).getByText("Missing latest price")).toBeVisible();
  expect(within(snapshot).getByText("2 offers")).toBeVisible();
});

test("offer discovery refuses a lowest-price claim for mixed currencies", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-usd-snapshot",
          currency: "USD",
          latestPrice: buildLatestPrice("price-usd-snapshot", "199.00")
        }),
        buildOffer({
          id: "merchant-product-eur-snapshot",
          currency: "EUR",
          latestPrice: buildLatestPrice("price-eur-snapshot", "149.00")
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  const snapshot = screen.getByRole("region", { name: "Visible offer snapshot" });

  expect(within(snapshot).getByText("Not comparable across currencies")).toBeVisible();
  expect(within(snapshot).queryByText("149.00 EUR")).not.toBeInTheDocument();
});

test("offer discovery reports no visible prices when every renderable row lacks one", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        buildOffer({
          id: "merchant-product-no-price-snapshot",
          latestPrice: null
        })
      ]
    })
  );

  renderOfferDiscoveryRoute();

  const snapshot = screen.getByRole("region", { name: "Visible offer snapshot" });

  expect(within(snapshot).getByText("No visible prices")).toBeVisible();
  expect(within(snapshot).getByText("1 offer")).toBeVisible();
});

test("offer discovery renders inactive filter state", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      activeOnly: false
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      offers: [
        {
          id: "merchant-product-1",
          url: "https://merchant.example.com/detail-product",
          currency: "USD",
          lastSeenAt: null,
          isActive: false,
          merchant: {
            id: "merchant-1",
            name: "Acme Market",
            domain: "acme.example"
          },
          product: {
            id: "product-1",
            name: "Detail Product",
            slug: "detail-product"
          },
          latestPrice: null,
          activeCoupons: buildCouponConnection([]),
          priceHistory: buildPriceHistoryConnection([])
        }
      ]
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByText("All offers")).toBeVisible();
  expect(screen.getByText("Inactive")).toBeVisible();
  expect(screen.getByText("No latest price.")).toBeVisible();
  expect(screen.getByRole("checkbox", { name: "Include inactive offers" })).toBeChecked();
});

test("offer discovery pagination preserves active-only and page-size filters", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      after: "previous-cursor",
      first: 12,
      merchantId: "TWVyY2hhbnQ6NDU2",
      activeOnly: false,
      sort: "price_desc"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      endCursor: "next-cursor",
      hasNextPage: true,
      hasPreviousPage: true
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("link", { name: "First offers" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D&merchantId=TWVyY2hhbnQ6NDU2&activeOnly=false&first=12&sort=price_desc"
  );
  expect(screen.getByRole("link", { name: "Next offers" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D&merchantId=TWVyY2hhbnQ6NDU2&activeOnly=false&first=12&sort=price_desc&after=next-cursor"
  );
});

test("offer discovery renders an empty state", () => {
  mockedUsePreloadedQuery.mockReturnValue(buildOfferDiscoveryData({ offers: [] }));

  renderOfferDiscoveryRoute();

  expect(screen.getByText("No offers match these filters.")).toBeVisible();
  expect(screen.getByText("Detail Product")).toBeVisible();
  expect(screen.getByText("Example Brand")).toBeVisible();
  expect(screen.getByRole("link", { name: "View product details" })).toHaveAttribute(
    "href",
    "/products/detail-product"
  );
  expect(screen.queryByRole("region", { name: "Visible offer snapshot" })).not.toBeInTheDocument();
});

test("offer discovery falls back to the raw product id when the selected product is missing", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({ selectedProduct: null })
  );

  renderOfferDiscoveryRoute();

  const filterSummary = screen.getByRole("region", { name: "Active offer filters" });

  expect(within(filterSummary).getByText("Product ID")).toBeVisible();
  expect(within(filterSummary).getByText("UHJvZHVjdDoxMjM=")).toBeVisible();
  expect(
    within(filterSummary).queryByRole("link", { name: "View product details" })
  ).not.toBeInTheDocument();
});

test("offer discovery falls back to the raw product id for non-product nodes", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({ selectedProduct: { __typename: "Brand" } })
  );

  renderOfferDiscoveryRoute();

  const filterSummary = screen.getByRole("region", { name: "Active offer filters" });

  expect(within(filterSummary).getByText("Product ID")).toBeVisible();
  expect(within(filterSummary).getByText("UHJvZHVjdDoxMjM=")).toBeVisible();
});

test("offer discovery omits brand context when the selected product has no brand", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({ selectedProduct: buildSelectedProduct({ brand: null }) })
  );

  renderOfferDiscoveryRoute();

  const filterSummary = screen.getByRole("region", { name: "Active offer filters" });

  expect(within(filterSummary).getByText("Product")).toBeVisible();
  expect(within(filterSummary).getByText("Detail Product")).toBeVisible();
  expect(within(filterSummary).queryByText("Brand")).not.toBeInTheDocument();
  expect(within(filterSummary).queryByText("Example Brand")).not.toBeInTheDocument();
});

test("offer discovery encodes selected product slugs in detail navigation", () => {
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      selectedProduct: buildSelectedProduct({ slug: "reserved/product?variant=1" })
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("link", { name: "View product details" })).toHaveAttribute(
    "href",
    "/products/reserved%2Fproduct%3Fvariant%3D1"
  );
});

test("offer discovery renders next-page and first-page links", () => {
  mockedUseLoaderData.mockReturnValue(
    buildReadyLoaderData({
      after: "previous-cursor",
      first: 12,
      merchantId: "TWVyY2hhbnQ6NDU2"
    })
  );
  mockedUsePreloadedQuery.mockReturnValue(
    buildOfferDiscoveryData({
      endCursor: "next-cursor",
      hasNextPage: true,
      hasPreviousPage: true
    })
  );

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("link", { name: "First offers" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D&merchantId=TWVyY2hhbnQ6NDU2&activeOnly=true&first=12"
  );
  expect(screen.getByRole("link", { name: "Next offers" })).toHaveAttribute(
    "href",
    "/offers?productId=UHJvZHVjdDoxMjM%3D&merchantId=TWVyY2hhbnQ6NDU2&activeOnly=true&first=12&after=next-cursor"
  );
});

test("offer discovery renders the loader error state", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "error",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: "UHJvZHVjdDoxMjM=",
      sort: "default"
    }
  } satisfies OfferDiscoveryLoaderData);

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("alert")).toHaveTextContent("Offers unavailable.");
  const filterSummary = screen.getByRole("region", { name: "Active offer filters" });

  expect(within(filterSummary).getByText("Product ID")).toBeVisible();
  expect(within(filterSummary).getByText("UHJvZHVjdDoxMjM=")).toBeVisible();
  expect(within(filterSummary).getByText("Offer status")).toBeVisible();
  expect(within(filterSummary).getByText("Active offers only")).toBeVisible();
  expect(within(filterSummary).getByText("Page size")).toBeVisible();
  expect(within(filterSummary).getByText("6")).toBeVisible();
  expect(within(filterSummary).getByText("Sort")).toBeVisible();
  expect(within(filterSummary).getByText("Default order")).toBeVisible();
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

test("offer discovery keeps raw product context visible while the query loads", () => {
  mockedUsePreloadedQuery.mockImplementation(() => {
    throw new Promise<never>(() => undefined);
  });

  renderOfferDiscoveryRoute();

  expect(screen.getByRole("status")).toHaveTextContent("Loading offers...");

  const filterSummary = screen.getByRole("region", { name: "Active offer filters" });

  expect(within(filterSummary).getByText("Product ID")).toBeVisible();
  expect(within(filterSummary).getByText("UHJvZHVjdDoxMjM=")).toBeVisible();
});

test("offer discovery renders the query unavailable state", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  mockedUsePreloadedQuery.mockReturnValue({
    merchantProducts: null
  });

  try {
    renderOfferDiscoveryRoute();

    expect(screen.getByRole("alert")).toHaveTextContent("Offers unavailable.");
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

function renderOfferDiscoveryRoute() {
  return render(
    <MemoryRouter>
      <OfferDiscoveryRoute />
    </MemoryRouter>
  );
}

function offerHeadings() {
  return within(screen.getByRole("list", { name: "Offers" }))
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
}

function buildReadyLoaderData(
  filters: Partial<Extract<OfferDiscoveryLoaderData, { status: "ready" }>["filters"]> = {}
) {
  return {
    status: "ready",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: "UHJvZHVjdDoxMjM=",
      sort: "default",
      ...filters
    },
    query: OFFER_DISCOVERY_QUERY_DESCRIPTOR
  } satisfies OfferDiscoveryLoaderData;
}

function buildOffer(overrides: Partial<OfferNode> = {}): OfferNode {
  return {
    id: "merchant-product-1",
    url: "https://merchant.example.com/detail-product",
    currency: "USD",
    lastSeenAt: "2026-06-02T12:00:00Z",
    isActive: true,
    merchant: buildMerchant("merchant-1", "Acme Market"),
    product: buildProduct("product-1", "Detail Product"),
    latestPrice: buildLatestPrice("price-1", "199.99"),
    activeCoupons: buildCouponConnection([]),
    priceHistory: buildPriceHistoryConnection([]),
    ...overrides
  };
}

function buildMerchant(id: string, name: string): NonNullable<OfferNode["merchant"]> {
  return {
    id,
    name,
    domain: `${name.toLowerCase().replace(/\s+/g, "-")}.example`
  };
}

function buildProduct(id: string, name: string): NonNullable<OfferNode["product"]> {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-")
  };
}

function buildLatestPrice(
  id: string,
  price: string
): NonNullable<OfferNode["latestPrice"]> {
  return {
    id,
    price,
    observedAt: "2026-06-01T00:00:00Z"
  };
}

function buildOfferDiscoveryData({
  endCursor = "cursor-1",
  hasNextPage = false,
  hasPreviousPage = false,
  selectedProduct = buildSelectedProduct(),
  offers = [
    {
      id: "merchant-product-1",
      url: "https://merchant.example.com/detail-product",
      currency: "USD",
      lastSeenAt: "2026-06-02T12:00:00Z",
      isActive: true,
      merchant: {
        id: "merchant-1",
        name: "Acme Market",
        domain: "acme.example"
      },
      product: {
        id: "product-1",
        name: "Detail Product",
        slug: "detail-product"
      },
      latestPrice: {
        id: "price-1",
        price: "199.99",
        observedAt: "2026-06-01T00:00:00Z"
      },
      activeCoupons: {
        edges: [
          {
            cursor: "coupon-cursor-1",
            node: {
              code: "SAVE20",
              description: "Save on the detail product.",
              discountType: "AMOUNT",
              discountValue: "20.00",
              currency: "USD",
              validTo: "2026-06-30T23:59:59Z",
              terms: "Online orders only."
            }
          }
        ],
        pageInfo: {
          hasNextPage: false
        }
      },
      priceHistory: {
        edges: [
          {
            node: {
              id: "price-history-1",
              price: "189.99",
              observedAt: "2026-05-30T10:00:00Z"
            }
          }
        ],
        pageInfo: {
          hasNextPage: false
        }
      }
    }
  ],
  startCursor = offers.length === 0 ? null : "cursor-1"
}: {
  endCursor?: string | null;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  offers?: Array<OfferNode>;
  selectedProduct?: SelectedProductNode;
  startCursor?: string | null;
} = {}) {
  return {
    selectedProduct,
    merchantProducts: {
      edges: offers.map((node, index) => ({
        cursor: `cursor-${index + 1}`,
        node
      })),
      pageInfo: {
        endCursor,
        hasNextPage,
        hasPreviousPage,
        startCursor
      }
    }
  };
}

function buildSelectedProduct(
  overrides: Partial<Extract<SelectedProductNode, { __typename: "Product" }>> = {}
): Extract<SelectedProductNode, { __typename: "Product" }> {
  return {
    __typename: "Product",
    id: "UHJvZHVjdDoxMjM=",
    name: "Detail Product",
    slug: "detail-product",
    brand: {
      id: "QnJhbmQ6MTIz",
      name: "Example Brand"
    },
    ...overrides
  };
}

type SelectedProductNode =
  | {
      __typename: "Product";
      id: string;
      name: string;
      slug: string;
      brand: {
        id: string;
        name: string;
      } | null;
    }
  | {
      __typename: string;
    }
  | null;

function buildCouponConnection(
  edges: ActiveCouponsConnection["edges"]
): ActiveCouponsConnection {
  return {
    edges,
    pageInfo: {
      hasNextPage: false
    }
  };
}

function buildPriceHistoryConnection(
  edges: PriceHistoryConnection["edges"]
): PriceHistoryConnection {
  return {
    edges,
    pageInfo: {
      hasNextPage: false
    }
  };
}
