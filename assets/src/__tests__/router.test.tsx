import { routes } from "../router";
import { CompareErrorBoundary } from "../routes/compare/error-boundary";
import { RevenueSummaryRoute } from "../routes/commerce/revenue";
import { revenueSummaryLoader } from "../routes/commerce/revenue/loader";

test("API token route has a route-level error boundary", () => {
  const apiTokensRoute = routes[0]?.children?.find(
    (route) => route.path === "account/api-tokens"
  );

  expect(apiTokensRoute?.errorElement).toEqual(
    <CompareErrorBoundary title="API tokens" />
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
      element: <RevenueSummaryRoute />
    })
  );
});
