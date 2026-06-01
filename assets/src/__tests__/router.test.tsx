import { routes } from "../router";
import { RouteErrorBoundary } from "../routes/compare/error-boundary";
import { RevenueSummaryRoute } from "../routes/commerce/revenue";
import { revenueSummaryLoader } from "../routes/commerce/revenue/loader";
import { MerchantDirectoryRoute } from "../routes/merchants";
import { merchantDirectoryLoader } from "../routes/merchants/loader";

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
      element: <MerchantDirectoryRoute />
    })
  );
});
