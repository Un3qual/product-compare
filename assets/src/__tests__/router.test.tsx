import { routes } from "../router";
import { CompareErrorBoundary } from "../routes/compare/error-boundary";

test("API token route has a route-level error boundary", () => {
  const apiTokensRoute = routes[0]?.children?.find(
    (route) => route.path === "account/api-tokens"
  );

  expect(apiTokensRoute?.errorElement).toEqual(
    <CompareErrorBoundary title="API tokens" />
  );
});
