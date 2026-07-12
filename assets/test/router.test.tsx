import { createClientRouter, routes, shouldRevalidateRootLoader } from "../src/router";
import { AffiliateSetupRoute } from "../src/routes/affiliate/setup/AffiliateSetupRoute";
import { affiliateSetupLoader } from "../src/routes/affiliate/setup/loader";
import { LogoutRoute } from "../src/routes/auth/LogoutRoute";
import { RouteErrorBoundary } from "../src/routes/compare/RouteErrorBoundary";
import { RevenueSummaryRoute } from "../src/routes/commerce/revenue/RevenueSummaryRoute";
import { revenueSummaryLoader } from "../src/routes/commerce/revenue/loader";
import { MerchantDirectoryRoute } from "../src/routes/merchants/MerchantDirectoryRoute";
import { merchantDirectoryLoader } from "../src/routes/merchants/loader";
import { OfferDiscoveryRoute } from "../src/routes/offers/OfferDiscoveryRoute";
import { offerDiscoveryLoader } from "../src/routes/offers/loader";
import { rootLoader, ROOT_ROUTE_ID } from "../src/routes/root/loader";
import { notFoundLoader } from "../src/routes/NotFoundRoute";
import type { RouteMetadataHandle } from "../src/routes/RouteMetadata";

test("root route preloads viewer state", () => {
  expect(routes[0]).toEqual(
    expect.objectContaining({
      id: ROOT_ROUTE_ID,
      loader: rootLoader,
      shouldRevalidate: shouldRevalidateRootLoader
    })
  );
});

test("root route revalidates viewer state only around auth route navigations", () => {
  expect(shouldRevalidateRootLoader(buildShouldRevalidateArgs("/products", "/compare"))).toBe(
    false
  );
  expect(shouldRevalidateRootLoader(buildShouldRevalidateArgs("/auth/login", "/"))).toBe(true);
  expect(shouldRevalidateRootLoader(buildShouldRevalidateArgs("/compare", "/auth/logout"))).toBe(
    true
  );
  expect(
    shouldRevalidateRootLoader(buildShouldRevalidateArgs("/products", "/compare?slug=one"))
  ).toBe(false);
});

test("client router requires Relay context for route loaders", () => {
  expect(() => createClientRouter(undefined as never)).toThrow(
    "Relay environment is required to create the client router"
  );
});

test("API token route has a route-level error boundary", () => {
  const apiTokensRoute = routes[0]?.children?.find(
    (route) => route.path === "account/api-tokens"
  );

  expect(apiTokensRoute?.errorElement).toEqual(
    <RouteErrorBoundary resourceName="API tokens page" title="API tokens" />
  );
});

test("revenue summary route is registered under the root route", () => {
  const revenueSummaryRoute = routes[0]?.children?.find(
    (route) => route.path === "commerce/revenue"
  );

  expect(revenueSummaryRoute).toEqual(
    expect.objectContaining({
      path: "commerce/revenue",
      loader: revenueSummaryLoader,
      element: <RevenueSummaryRoute />,
      errorElement: <RouteErrorBoundary resourceName="revenue report" title="Revenue" />
    })
  );
});

test("merchant directory route is registered under the root route", () => {
  const merchantDirectoryRoute = routes[0]?.children?.find((route) => route.path === "merchants");

  expect(merchantDirectoryRoute).toEqual(
    expect.objectContaining({
      path: "merchants",
      loader: merchantDirectoryLoader,
      element: <MerchantDirectoryRoute />,
      errorElement: <RouteErrorBoundary resourceName="merchant directory" title="Merchants" />
    })
  );
});

test("affiliate setup route is registered under the root route", () => {
  const affiliateSetupRoute = routes[0]?.children?.find(
    (route) => route.path === "affiliate/setup"
  );

  expect(affiliateSetupRoute).toEqual(
    expect.objectContaining({
      path: "affiliate/setup",
      loader: affiliateSetupLoader,
      element: <AffiliateSetupRoute />,
      errorElement: <RouteErrorBoundary resourceName="affiliate setup" title="Affiliate setup" />
    })
  );
});

test("offer discovery route is registered under the root route", () => {
  const offerDiscoveryRoute = routes[0]?.children?.find((route) => route.path === "offers");

  expect(offerDiscoveryRoute).toEqual(
    expect.objectContaining({
      path: "offers",
      loader: offerDiscoveryLoader,
      element: <OfferDiscoveryRoute />,
      errorElement: <RouteErrorBoundary resourceName="offer discovery" title="Offers" />
    })
  );
});

test("logout route is registered under the root route", () => {
  const logoutRoute = routes[0]?.children?.find((route) => route.path === "auth/logout");

  expect(logoutRoute).toEqual(
    expect.objectContaining({
      path: "auth/logout",
      element: <LogoutRoute />
    })
  );
});

test("application router registers a wildcard 404 route", () => {
  const notFoundRoute = routes[0]?.children?.find((route) => route.path === "*");

  expect(notFoundRoute).toEqual(
    expect.objectContaining({
      path: "*",
      loader: notFoundLoader,
      errorElement: <RouteErrorBoundary resourceName="page" title="Page not found" />
    })
  );
});

test("every registered application route declares document metadata", () => {
  const routeHandles = [routes[0], ...(routes[0]?.children ?? [])].map(
    (route) => route?.handle as RouteMetadataHandle | undefined
  );

  expect(routeHandles).not.toContain(undefined);

  for (const handle of routeHandles) {
    expect(handle?.metadata.title).toBeTruthy();
    expect(handle?.metadata.description).toBeTruthy();
  }
});

function buildShouldRevalidateArgs(
  currentPath: string,
  nextPath: string
) {
  return {
    actionResult: undefined,
    currentParams: {},
    currentUrl: new URL(currentPath, "https://app.example.com"),
    defaultShouldRevalidate: true,
    formAction: undefined,
    formData: undefined,
    formEncType: undefined,
    formMethod: undefined,
    nextParams: {},
    nextUrl: new URL(nextPath, "https://app.example.com")
  };
}
