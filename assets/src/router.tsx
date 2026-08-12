import type { ComponentType } from "react";
import type { HydrationState, RouteObject, ShouldRevalidateFunctionArgs } from "react-router-dom";
import { createBrowserRouter, redirect } from "react-router-dom";
import type { Environment } from "relay-runtime";
import { createRelayRouterContext } from "./relay/route-preload";
import { RouteErrorBoundary } from "./routes/compare/RouteErrorBoundary";
import { notFoundLoader } from "./routes/NotFoundRoute";
import type { RouteMetadataHandle } from "./routes/RouteMetadata";
import { RootLayout } from "./routes/RootRoute";
import { rootLoader, ROOT_ROUTE_ID } from "./routes/RootRoute";

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
    errorElement: <RouteErrorBoundary resourceName="page" title="Product Compare" />,
    children: [
      {
        index: true,
        handle: routeMetadata(
          "Product Compare",
          "Choose products with clearer specifications and current offers.",
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { HomeRoute, homeLoader } = await import("./routes/home/HomeRoute");
          return { Component: HomeRoute, loader: homeLoader };
        }),
      },
      {
        path: "products",
        handle: routeMetadata(
          "Browse products | Product Compare",
          "Browse the product catalog and narrow the results by the attributes that matter.",
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { BrowseRoute, browseLoader } = await import("./routes/catalog/BrowseRoute");
          return { Component: BrowseRoute, loader: browseLoader };
        }),
      },
      {
        path: "products/:slug",
        handle: routeMetadata(
          "Product details | Product Compare",
          "Review product specifications, current offers, and price history.",
        ),
        errorElement: <RouteErrorBoundary resourceName="product" title="Product details" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { ProductDetailRoute, productDetailLoader } =
            await import("./routes/products/ProductDetailRoute");
          return {
            Component: ProductDetailRoute,
            loader: productDetailLoader,
          };
        }),
      },
      {
        path: "merchants",
        handle: routeMetadata(
          "Merchants | Product Compare",
          "Browse merchants represented in current Product Compare offers.",
        ),
        errorElement: <RouteErrorBoundary resourceName="merchant directory" title="Merchants" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { MerchantDirectoryRoute, merchantDirectoryLoader } =
            await import("./routes/merchants/MerchantDirectoryRoute");
          return {
            Component: MerchantDirectoryRoute,
            loader: merchantDirectoryLoader,
          };
        }),
      },
      {
        path: "merchants/:slug",
        handle: routeMetadata(
          "Merchant details | Product Compare",
          "Review a merchant's current product and offer details.",
        ),
        errorElement: <RouteErrorBoundary resourceName="merchant" title="Merchant details" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { MerchantDetailRoute, merchantDetailLoader } =
            await import("./routes/merchants/detail/MerchantDetailRoute");
          return { Component: MerchantDetailRoute, loader: merchantDetailLoader };
        }),
      },
      {
        path: "categories/:slug",
        handle: routeMetadata(
          "Product category | Product Compare",
          "Compare trusted product specifications and current offer details by category.",
        ),
        errorElement: <RouteErrorBoundary resourceName="category" title="Product category" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { CategoryRoute, categoryLoader } =
            await import("./routes/categories/CategoryRoute");
          return { Component: CategoryRoute, loader: categoryLoader };
        }),
      },
      {
        path: "affiliate/setup",
        handle: routeMetadata(
          "Affiliate setup | Product Compare",
          "Configure merchant affiliate programs used for outbound offer links.",
        ),
        errorElement: <RouteErrorBoundary resourceName="affiliate setup" title="Affiliate setup" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { AffiliateSetupRoute, affiliateSetupLoader } =
            await import("./routes/affiliate/setup/AffiliateSetupRoute");
          return {
            Component: AffiliateSetupRoute,
            loader: affiliateSetupLoader,
          };
        }),
      },
      {
        path: "offers",
        handle: routeMetadata(
          "Offers | Product Compare",
          "Discover current product offers, coupons, and merchant availability.",
        ),
        errorElement: <RouteErrorBoundary resourceName="offer discovery" title="Offers" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { OfferDiscoveryRoute, offerDiscoveryLoader } =
            await import("./routes/offers/OfferDiscoveryRoute");
          return {
            Component: OfferDiscoveryRoute,
            loader: offerDiscoveryLoader,
          };
        }),
      },
      {
        path: "ingestion/cj-programs",
        handle: routeMetadata(
          "CJ programs | Product Compare",
          "Manage CJ advertiser programs through their lifecycle and inspect their observed feeds.",
        ),
        errorElement: <RouteErrorBoundary resourceName="CJ programs" title="CJ programs" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { CJProgramsRoute, cjProgramsLoader } =
            await import("./routes/ingestion/cj-programs/CJProgramsRoute");
          return {
            Component: CJProgramsRoute,
            loader: cjProgramsLoader,
          };
        }),
      },
      {
        path: "ingestion/feed-candidates",
        handle: routeMetadata(
          "CJ programs | Product Compare",
          "Manage CJ advertiser programs through their lifecycle and inspect their observed feeds.",
        ),
        loader: () => redirect("/ingestion/cj-programs"),
      },
      {
        path: "compare",
        handle: routeMetadata(
          "Compare products | Product Compare",
          "Compare loaded products by specifications and current offers.",
        ),
        errorElement: <RouteErrorBoundary />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { CompareRoute, compareLoader, shouldRevalidateCompareLoader } =
            await import("./routes/compare/CompareRoute");
          return {
            Component: CompareRoute,
            loader: compareLoader,
            shouldRevalidate: shouldRevalidateCompareLoader,
          };
        }),
      },
      {
        path: "compare/shared/:token",
        handle: routeMetadata(
          "Shared comparison | Product Compare",
          "Review a fixed, source-backed product comparison snapshot.",
        ),
        errorElement: (
          <RouteErrorBoundary resourceName="shared comparison" title="Shared comparison" />
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { SharedComparisonRoute, sharedComparisonLoader } =
            await import("./routes/compare/shared/SharedComparisonRoute");
          return { Component: SharedComparisonRoute, loader: sharedComparisonLoader };
        }),
      },
      {
        path: "compare/saved",
        handle: routeMetadata(
          "Saved comparisons | Product Compare",
          "Return to product comparisons saved to your account.",
        ),
        errorElement: <RouteErrorBoundary title="Saved comparisons" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { SavedComparisonsRoute, savedComparisonsLoader } =
            await import("./routes/compare/SavedComparisonsRoute");
          return {
            Component: SavedComparisonsRoute,
            loader: savedComparisonsLoader,
          };
        }),
      },
      {
        path: "commerce/revenue",
        handle: routeMetadata(
          "Revenue preview | Product Compare",
          "Preview attributed commerce revenue and commission summaries.",
        ),
        errorElement: <RouteErrorBoundary resourceName="revenue report" title="Revenue" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { RevenueSummaryRoute, revenueSummaryLoader } =
            await import("./routes/commerce/revenue/RevenueSummaryRoute");
          return {
            Component: RevenueSummaryRoute,
            loader: revenueSummaryLoader,
          };
        }),
      },
      {
        path: "account/alerts",
        handle: routeMetadata(
          "Price alerts | Product Compare",
          "Manage product price watches and review qualifying price or availability changes.",
        ),
        errorElement: <RouteErrorBoundary resourceName="price alerts" title="Price alerts" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { AlertsRoute, alertsLoader } = await import("./routes/account/alerts/AlertsRoute");
          return { Component: AlertsRoute, loader: alertsLoader };
        }),
      },
      {
        path: "account/api-tokens",
        handle: routeMetadata(
          "API tokens | Product Compare",
          "Create and manage API tokens for connected Product Compare tools.",
        ),
        errorElement: <RouteErrorBoundary resourceName="API tokens page" title="API tokens" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const { ApiTokensRoute, apiTokensLoader } =
            await import("./routes/account/api-tokens/ApiTokensRoute");
          return {
            Component: ApiTokensRoute,
            loader: apiTokensLoader,
          };
        }),
      },
      {
        path: "auth/login",
        handle: routeMetadata(
          "Sign in | Product Compare",
          "Sign in to manage saved comparisons and account tools.",
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { LoginRoute } = await import("./routes/auth/LoginRoute");
          return { Component: LoginRoute };
        }),
      },
      {
        path: "auth/logout",
        handle: routeMetadata(
          "Sign out | Product Compare",
          "Sign out of your Product Compare account.",
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { LogoutRoute } = await import("./routes/auth/LogoutRoute");
          return { Component: LogoutRoute };
        }),
      },
      {
        path: "auth/register",
        handle: routeMetadata(
          "Create account | Product Compare",
          "Create an account to save comparisons and manage connected tools.",
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { RegisterRoute } = await import("./routes/auth/RegisterRoute");
          return { Component: RegisterRoute };
        }),
      },
      {
        path: "auth/forgot-password",
        handle: routeMetadata(
          "Forgot password | Product Compare",
          "Request a secure Product Compare password reset link.",
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { ForgotPasswordRoute } = await import("./routes/auth/ForgotPasswordRoute");
          return { Component: ForgotPasswordRoute };
        }),
      },
      {
        path: "auth/reset-password",
        handle: routeMetadata(
          "Reset password | Product Compare",
          "Choose a new password for your Product Compare account.",
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { ResetPasswordRoute } = await import("./routes/auth/ResetPasswordRoute");
          return { Component: ResetPasswordRoute };
        }),
      },
      {
        path: "auth/verify-email",
        handle: routeMetadata(
          "Verify email | Product Compare",
          "Verify the email address connected to your Product Compare account.",
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { VerifyEmailRoute } = await import("./routes/auth/VerifyEmailRoute");
          return { Component: VerifyEmailRoute };
        }),
      },
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

type LazyRouteModule = {
  Component: ComponentType;
  loader?: RouteObject["loader"];
};

function withLazyRouteImportRecovery<T extends LazyRouteModule>(loadRouteModule: () => Promise<T>) {
  return async () => {
    try {
      return await loadRouteModule();
    } catch (error) {
      return {
        Component: function LazyRouteImportFailure() {
          return null;
        },
        loader: function lazyRouteImportFailureLoader(): never {
          throw error;
        },
      };
    }
  };
}

function isAuthRoutePath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

function routeMetadata(title: string, description: string): RouteMetadataHandle {
  return {
    metadata: {
      description,
      title,
    },
  };
}
