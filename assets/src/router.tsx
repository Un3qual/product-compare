import type { HydrationState, RouteObject, ShouldRevalidateFunctionArgs } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";
import type { Environment } from "relay-runtime";
import { routeMetadata } from "./frontend/head";
import { createRelayRouterContext } from "./relay/route-preload";
import { accountRoutes } from "./routes/config/account-routes";
import { operatorRoutes } from "./routes/config/operator-routes";
import { shopperRoutes } from "./routes/config/shopper-routes";
import { RouteErrorBoundary } from "./routes/compare/RouteErrorBoundary";
import { notFoundLoader } from "./routes/NotFoundRoute";
import { RootHydrateFallback, RootLayout, rootLoader, ROOT_ROUTE_ID } from "./routes/RootRoute";

declare global {
  interface Window {
    __staticRouterHydrationData?: HydrationState;
  }
}

export function shouldRevalidateRootLoader({ currentUrl, nextUrl }: ShouldRevalidateFunctionArgs) {
  return isAuthRoutePath(currentUrl.pathname) || isAuthRoutePath(nextUrl.pathname);
}

export const routes: RouteObject[] = [
  {
    path: "/",
    id: ROOT_ROUTE_ID,
    handle: routeMetadata(
      "Product Compare",
      "Choose products with clearer specifications and current offers.",
    ),
    loader: rootLoader,
    shouldRevalidate: shouldRevalidateRootLoader,
    element: <RootLayout />,
    HydrateFallback: RootHydrateFallback,
    errorElement: <RouteErrorBoundary resourceName="page" title="Product Compare" />,
    children: [
      ...shopperRoutes,
      ...accountRoutes,
      ...operatorRoutes,
      {
        path: "*",
        handle: routeMetadata(
          "Page not found | Product Compare",
          "The requested Product Compare page could not be found.",
        ),
        loader: notFoundLoader,
        errorElement: <RouteErrorBoundary resourceName="page" title="Page not found" />,
      },
    ],
  },
];

export function createClientRouter(relayEnvironment: Environment) {
  if (!relayEnvironment) {
    throw new Error("Relay environment is required to create the client router");
  }

  return createBrowserRouter(routes, {
    getContext: () => createRelayRouterContext(relayEnvironment),
    hydrationData: typeof window === "undefined" ? undefined : window.__staticRouterHydrationData,
  });
}

function isAuthRoutePath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}
