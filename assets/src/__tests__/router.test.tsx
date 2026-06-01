import { routes } from "../router";
import { AffiliateSetupRoute } from "../routes/affiliate/setup";
import { affiliateSetupLoader } from "../routes/affiliate/setup/loader";
import { LogoutRoute } from "../routes/auth/logout";
import { RouteErrorBoundary } from "../routes/compare/error-boundary";
import { RevenueSummaryRoute } from "../routes/commerce/revenue";
import { revenueSummaryLoader } from "../routes/commerce/revenue/loader";
import { MerchantDirectoryRoute } from "../routes/merchants";
import { merchantDirectoryLoader } from "../routes/merchants/loader";
import { rootLoader, ROOT_ROUTE_ID } from "../routes/root/loader";

test("root route preloads viewer state", () => {
  expect(routes[0]).toEqual(
    expect.objectContaining({
      id: ROOT_ROUTE_ID,
      loader: rootLoader
    })
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

test("logout route is registered under the root route", () => {
  const logoutRoute = routes[0]?.children?.find((route) => route.path === "auth/logout");

  expect(logoutRoute).toEqual(
    expect.objectContaining({
      path: "auth/logout",
      element: <LogoutRoute />
    })
  );
});
