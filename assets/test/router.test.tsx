import { render, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { createClientRouter, routes, shouldRevalidateRootLoader } from "../src/router";
import { ApiTokensRoute } from "../src/routes/account/api-tokens/ApiTokensRoute";
import { apiTokensLoader } from "../src/routes/account/api-tokens/loader";
import { AffiliateSetupRoute } from "../src/routes/affiliate/setup/AffiliateSetupRoute";
import { affiliateSetupLoader } from "../src/routes/affiliate/setup/loader";
import { LogoutRoute } from "../src/routes/auth/LogoutRoute";
import { RouteErrorBoundary } from "../src/routes/compare/RouteErrorBoundary";
import { RevenueSummaryRoute } from "../src/routes/commerce/revenue/RevenueSummaryRoute";
import { revenueSummaryLoader } from "../src/routes/commerce/revenue/loader";
import { CJProgramsRoute } from "../src/routes/ingestion/cj-programs/CJProgramsRoute";
import { cjProgramsLoader } from "../src/routes/ingestion/cj-programs/loader";
import { MerchantDirectoryRoute } from "../src/routes/merchants/MerchantDirectoryRoute";
import { merchantDirectoryLoader } from "../src/routes/merchants/loader";
import { OfferDiscoveryRoute } from "../src/routes/offers/OfferDiscoveryRoute";
import { offerDiscoveryLoader } from "../src/routes/offers/loader";
import { ProductDetailRoute } from "../src/routes/products/ProductDetailRoute";
import { productDetailLoader } from "../src/routes/products/loader";
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

test("API token navigation lazily resolves its screen and loader", async () => {
  const apiTokensRoute = findRoute("account/api-tokens");
  const resolvedRoute = await resolveLazyRoute(apiTokensRoute);

  expect(resolvedRoute).toEqual(
    expect.objectContaining({
      Component: ApiTokensRoute,
      loader: apiTokensLoader
    })
  );
  expect(apiTokensRoute.errorElement).toEqual(
    <RouteErrorBoundary resourceName="API tokens page" title="API tokens" />
  );
});

test("revenue summary navigation lazily resolves its screen and loader", async () => {
  const revenueSummaryRoute = findRoute("commerce/revenue");
  const resolvedRoute = await resolveLazyRoute(revenueSummaryRoute);

  expect(resolvedRoute).toEqual(
    expect.objectContaining({
      loader: revenueSummaryLoader,
      Component: RevenueSummaryRoute
    })
  );
  expect(revenueSummaryRoute.errorElement).toEqual(
    <RouteErrorBoundary resourceName="revenue report" title="Revenue" />
  );
});

test("merchant directory navigation lazily resolves its screen and loader", async () => {
  const merchantDirectoryRoute = findRoute("merchants");
  const resolvedRoute = await resolveLazyRoute(merchantDirectoryRoute);

  expect(resolvedRoute).toEqual(
    expect.objectContaining({
      loader: merchantDirectoryLoader,
      Component: MerchantDirectoryRoute
    })
  );
  expect(merchantDirectoryRoute.errorElement).toEqual(
    <RouteErrorBoundary resourceName="merchant directory" title="Merchants" />
  );
});

test("affiliate setup navigation lazily resolves its screen and loader", async () => {
  const affiliateSetupRoute = findRoute("affiliate/setup");
  const resolvedRoute = await resolveLazyRoute(affiliateSetupRoute);

  expect(resolvedRoute).toEqual(
    expect.objectContaining({
      loader: affiliateSetupLoader,
      Component: AffiliateSetupRoute
    })
  );
  expect(affiliateSetupRoute.errorElement).toEqual(
    <RouteErrorBoundary resourceName="affiliate setup" title="Affiliate setup" />
  );
});

test("CJ programs navigation lazily resolves its screen and loader", async () => {
  const cjProgramsRoute = findRoute("ingestion/cj-programs");
  const resolvedRoute = await resolveLazyRoute(cjProgramsRoute);

  expect(resolvedRoute).toEqual(
    expect.objectContaining({
      Component: CJProgramsRoute,
      loader: cjProgramsLoader
    })
  );
  expect(cjProgramsRoute.errorElement).toEqual(
    <RouteErrorBoundary resourceName="CJ programs" title="CJ programs" />
  );
});

test("legacy feed candidate navigation redirects to CJ programs", async () => {
  const legacyRoute = findRoute("ingestion/feed-candidates");

  if (typeof legacyRoute.loader !== "function") {
    throw new Error("Legacy feed candidate route is missing its redirect loader.");
  }

  const response = await legacyRoute.loader({} as never);

  expect(response).toBeInstanceOf(Response);
  if (!(response instanceof Response)) {
    throw new Error("Legacy feed candidate route did not return a redirect response.");
  }
  expect(response.status).toBe(302);
  expect(response.headers.get("Location")).toBe("/ingestion/cj-programs");
});

test("offer discovery navigation lazily resolves its screen and loader", async () => {
  const offerDiscoveryRoute = findRoute("offers");
  const resolvedRoute = await resolveLazyRoute(offerDiscoveryRoute);

  expect(resolvedRoute).toEqual(
    expect.objectContaining({
      loader: offerDiscoveryLoader,
      Component: OfferDiscoveryRoute
    })
  );
  expect(offerDiscoveryRoute.errorElement).toEqual(
    <RouteErrorBoundary resourceName="offer discovery" title="Offers" />
  );
});

test("product detail navigation lazily resolves its screen and loader", async () => {
  const productDetailRoute = findRoute("products/:slug");
  const resolvedRoute = await resolveLazyRoute(productDetailRoute);

  expect(resolvedRoute).toEqual(
    expect.objectContaining({
      Component: ProductDetailRoute,
      loader: productDetailLoader
    })
  );
  expect(productDetailRoute.errorElement).toEqual(
    <RouteErrorBoundary resourceName="product" title="Product details" />
  );
});

test("product detail lazy import errors render product-specific route feedback", async () => {
  vi.doMock("../src/routes/products/ProductDetailRoute", () => {
    throw new Error("product chunk import failed");
  });

  const productDetailRoute = findRoute("products/:slug");
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <Outlet />,
        errorElement: routes[0]?.errorElement,
        children: [productDetailRoute]
      }
    ],
    { initialEntries: ["/products/missing-product"] }
  );

  try {
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "Product details" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "An unexpected error occurred while loading the product."
    );
    expect(screen.queryByText("Unexpected Application Error!")).not.toBeInTheDocument();
  } finally {
    vi.doUnmock("../src/routes/products/ProductDetailRoute");
  }
});

test("product detail loader errors render product-specific route feedback", async () => {
  const productDetailRoute = findRoute("products/:slug");
  const resolvedRoute = await resolveLazyRoute(productDetailRoute);
  const router = createMemoryRouter(
    [
      {
        path: "/products/:slug",
        loader: () => {
          throw new Error("Relay product read failed");
        },
        Component: resolvedRoute.Component,
        errorElement: productDetailRoute.errorElement
      }
    ],
    { initialEntries: ["/products/missing-product"] }
  );

  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("heading", { name: "Product details" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "An unexpected error occurred while loading the product."
  );
  expect(screen.queryByText("Unexpected Application Error!")).not.toBeInTheDocument();
});

test("logout navigation lazily resolves its screen", async () => {
  const logoutRoute = findRoute("auth/logout");
  const resolvedRoute = await resolveLazyRoute(logoutRoute);

  expect(resolvedRoute).toEqual(expect.objectContaining({ Component: LogoutRoute }));
});

test("every non-root screen is absent from the initial route graph", () => {
  const nonRootRoutes = (routes[0]?.children ?? []).filter(
    (route) => !route.index && route.path !== "*"
  );

  for (const route of nonRootRoutes) {
    if (route.path === "ingestion/feed-candidates") {
      continue;
    }

    expect(route.lazy, route.path).toEqual(expect.any(Function));
    expect(route, route.path).not.toHaveProperty("element");
    expect(route, route.path).not.toHaveProperty("Component");
    expect(route, route.path).not.toHaveProperty("loader");
  }
});

test("root error boundary handles a rejected lazy route", async () => {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <Outlet />,
        errorElement: routes[0]?.errorElement,
        children: [
          {
            path: "broken-chunk",
            lazy: () => Promise.reject(new Error("chunk import failed"))
          }
        ]
      }
    ],
    { initialEntries: ["/broken-chunk"] }
  );

  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("heading", { name: "Product Compare" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "An unexpected error occurred while loading the page."
  );
  expect(screen.queryByText("Unexpected Application Error!")).not.toBeInTheDocument();
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

function findRoute(path: string) {
  const route = routes[0]?.children?.find((candidate) => candidate.path === path);
  if (!route) throw new Error(`Missing route: ${path}`);
  return route;
}

function resolveLazyRoute(route: ReturnType<typeof findRoute>) {
  if (typeof route.lazy !== "function") {
    throw new Error(`Route is not lazy: ${route.path}`);
  }

  return route.lazy();
}
