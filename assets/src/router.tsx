import type { ComponentType } from "react";
import type { HydrationState, RouteObject, ShouldRevalidateFunctionArgs } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";
import type { Environment } from "relay-runtime";
import { createRelayRouterContext } from "./relay/route-preload";
import { RouteErrorBoundary } from "./routes/compare/RouteErrorBoundary";
import { notFoundLoader } from "./routes/NotFoundRoute";
import type { RouteMetadataHandle } from "./routes/RouteMetadata";
import { RootLayout, RootRoute } from "./routes/RootRoute";
import { rootLoader, ROOT_ROUTE_ID } from "./routes/root/loader";

declare global {
  interface Window {
    __staticRouterHydrationData?: HydrationState;
  }
}

export function shouldRevalidateRootLoader({
  currentUrl,
  nextUrl
}: ShouldRevalidateFunctionArgs) {
  return isAuthRoutePath(currentUrl.pathname) || isAuthRoutePath(nextUrl.pathname);
}

export const routes: RouteObject[] = [
  {
    path: "/",
    id: ROOT_ROUTE_ID,
    handle: routeMetadata(
      "Product Compare",
      "Choose products with clearer specifications and current offers."
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
          "Choose products with clearer specifications and current offers."
        ),
        element: <RootRoute />
      },
      {
        path: "products",
        handle: routeMetadata(
          "Browse products | Product Compare",
          "Browse the product catalog and narrow the results by the attributes that matter."
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ BrowseRoute }, { browseLoader }] = await Promise.all([
            import("./routes/catalog/BrowseRoute"),
            import("./routes/catalog/loader")
          ]);
          return { Component: BrowseRoute, loader: browseLoader };
        })
      },
      {
        path: "products/:slug",
        handle: routeMetadata(
          "Product details | Product Compare",
          "Review product specifications, current offers, and price history."
        ),
        errorElement: <RouteErrorBoundary resourceName="product" title="Product details" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ ProductDetailRoute }, { productDetailLoader }] = await Promise.all([
            import("./routes/products/ProductDetailRoute"),
            import("./routes/products/loader")
          ]);
          return {
            Component: ProductDetailRoute,
            loader: productDetailLoader
          };
        })
      },
      {
        path: "merchants",
        handle: routeMetadata(
          "Merchants | Product Compare",
          "Browse merchants represented in current Product Compare offers."
        ),
        errorElement: (
          <RouteErrorBoundary resourceName="merchant directory" title="Merchants" />
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ MerchantDirectoryRoute }, { merchantDirectoryLoader }] = await Promise.all([
            import("./routes/merchants/MerchantDirectoryRoute"),
            import("./routes/merchants/loader")
          ]);
          return {
            Component: MerchantDirectoryRoute,
            loader: merchantDirectoryLoader
          };
        })
      },
      {
        path: "affiliate/setup",
        handle: routeMetadata(
          "Affiliate setup | Product Compare",
          "Configure merchant affiliate programs used for outbound offer links."
        ),
        errorElement: (
          <RouteErrorBoundary resourceName="affiliate setup" title="Affiliate setup" />
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ AffiliateSetupRoute }, { affiliateSetupLoader }] = await Promise.all([
            import("./routes/affiliate/setup/AffiliateSetupRoute"),
            import("./routes/affiliate/setup/loader")
          ]);
          return {
            Component: AffiliateSetupRoute,
            loader: affiliateSetupLoader
          };
        })
      },
      {
        path: "offers",
        handle: routeMetadata(
          "Offers | Product Compare",
          "Discover current product offers, coupons, and merchant availability."
        ),
        errorElement: <RouteErrorBoundary resourceName="offer discovery" title="Offers" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ OfferDiscoveryRoute }, { offerDiscoveryLoader }] = await Promise.all([
            import("./routes/offers/OfferDiscoveryRoute"),
            import("./routes/offers/loader")
          ]);
          return {
            Component: OfferDiscoveryRoute,
            loader: offerDiscoveryLoader
          };
        })
      },
      {
        path: "ingestion/feed-candidates",
        handle: routeMetadata(
          "CJ feed candidates | Product Compare",
          "Review CJ feed candidates before importing products and offers."
        ),
        errorElement: (
          <RouteErrorBoundary resourceName="feed candidates" title="CJ feed candidates" />
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ FeedCandidatesRoute }, { feedCandidatesLoader }] = await Promise.all([
            import("./routes/ingestion/feed-candidates/FeedCandidatesRoute"),
            import("./routes/ingestion/feed-candidates/loader")
          ]);
          return {
            Component: FeedCandidatesRoute,
            loader: feedCandidatesLoader
          };
        })
      },
      {
        path: "compare",
        handle: routeMetadata(
          "Compare products | Product Compare",
          "Compare loaded products by specifications and current offers."
        ),
        errorElement: <RouteErrorBoundary />,
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ CompareRoute }, { compareLoader }] = await Promise.all([
            import("./routes/compare/CompareRoute"),
            import("./routes/compare/loader")
          ]);
          return {
            Component: CompareRoute,
            loader: compareLoader
          };
        })
      },
      {
        path: "compare/shared/:token",
        handle: routeMetadata(
          "Shared comparison | Product Compare",
          "Review a fixed, source-backed product comparison snapshot."
        ),
        errorElement: <RouteErrorBoundary resourceName="shared comparison" title="Shared comparison" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ SharedComparisonRoute }, { sharedComparisonLoader }] = await Promise.all([
            import("./routes/compare/shared/SharedComparisonRoute"),
            import("./routes/compare/shared/loader")
          ]);
          return { Component: SharedComparisonRoute, loader: sharedComparisonLoader };
        })
      },
      {
        path: "compare/saved",
        handle: routeMetadata(
          "Saved comparisons | Product Compare",
          "Return to product comparisons saved to your account."
        ),
        errorElement: <RouteErrorBoundary title="Saved comparisons" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ SavedComparisonsRoute }, { savedComparisonsLoader }] = await Promise.all([
            import("./routes/compare/SavedComparisonsRoute"),
            import("./routes/compare/saved-data")
          ]);
          return {
            Component: SavedComparisonsRoute,
            loader: savedComparisonsLoader
          };
        })
      },
      {
        path: "commerce/revenue",
        handle: routeMetadata(
          "Revenue preview | Product Compare",
          "Preview attributed commerce revenue and commission summaries."
        ),
        errorElement: <RouteErrorBoundary resourceName="revenue report" title="Revenue" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ RevenueSummaryRoute }, { revenueSummaryLoader }] = await Promise.all([
            import("./routes/commerce/revenue/RevenueSummaryRoute"),
            import("./routes/commerce/revenue/loader")
          ]);
          return {
            Component: RevenueSummaryRoute,
            loader: revenueSummaryLoader
          };
        })
      },
      {
        path: "account/alerts",
        handle: routeMetadata(
          "Price alerts | Product Compare",
          "Manage product price watches and review qualifying price or availability changes."
        ),
        errorElement: <RouteErrorBoundary resourceName="price alerts" title="Price alerts" />,
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ AlertsRoute }, { alertsLoader }] = await Promise.all([
            import("./routes/account/alerts/AlertsRoute"),
            import("./routes/account/alerts/loader")
          ]);
          return { Component: AlertsRoute, loader: alertsLoader };
        })
      },
      {
        path: "account/api-tokens",
        handle: routeMetadata(
          "API tokens | Product Compare",
          "Create and manage API tokens for connected Product Compare tools."
        ),
        errorElement: (
          <RouteErrorBoundary resourceName="API tokens page" title="API tokens" />
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const [{ ApiTokensRoute }, { apiTokensLoader }] = await Promise.all([
            import("./routes/account/api-tokens/ApiTokensRoute"),
            import("./routes/account/api-tokens/loader")
          ]);
          return {
            Component: ApiTokensRoute,
            loader: apiTokensLoader
          };
        })
      },
      {
        path: "auth/login",
        handle: routeMetadata(
          "Sign in | Product Compare",
          "Sign in to manage saved comparisons and account tools."
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { LoginRoute } = await import("./routes/auth/LoginRoute");
          return { Component: LoginRoute };
        })
      },
      {
        path: "auth/logout",
        handle: routeMetadata(
          "Sign out | Product Compare",
          "Sign out of your Product Compare account."
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { LogoutRoute } = await import("./routes/auth/LogoutRoute");
          return { Component: LogoutRoute };
        })
      },
      {
        path: "auth/register",
        handle: routeMetadata(
          "Create account | Product Compare",
          "Create an account to save comparisons and manage connected tools."
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { RegisterRoute } = await import("./routes/auth/RegisterRoute");
          return { Component: RegisterRoute };
        })
      },
      {
        path: "auth/forgot-password",
        handle: routeMetadata(
          "Forgot password | Product Compare",
          "Request a secure Product Compare password reset link."
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { ForgotPasswordRoute } = await import("./routes/auth/ForgotPasswordRoute");
          return { Component: ForgotPasswordRoute };
        })
      },
      {
        path: "auth/reset-password",
        handle: routeMetadata(
          "Reset password | Product Compare",
          "Choose a new password for your Product Compare account."
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { ResetPasswordRoute } = await import("./routes/auth/ResetPasswordRoute");
          return { Component: ResetPasswordRoute };
        })
      },
      {
        path: "auth/verify-email",
        handle: routeMetadata(
          "Verify email | Product Compare",
          "Verify the email address connected to your Product Compare account."
        ),
        lazy: withLazyRouteImportRecovery(async () => {
          const { VerifyEmailRoute } = await import("./routes/auth/VerifyEmailRoute");
          return { Component: VerifyEmailRoute };
        })
      },
      {
        path: "*",
        handle: routeMetadata(
          "Page not found | Product Compare",
          "The requested Product Compare page could not be found."
        ),
        loader: notFoundLoader,
        errorElement: <RouteErrorBoundary resourceName="page" title="Page not found" />
      }
    ]
  }
];

export function createClientRouter(relayEnvironment: Environment) {
  if (!relayEnvironment) {
    throw new Error("Relay environment is required to create the client router");
  }

  return createBrowserRouter(routes, {
    getContext: () => createRelayRouterContext(relayEnvironment),
    hydrationData: typeof window === "undefined" ? undefined : window.__staticRouterHydrationData
  });
}

type LazyRouteModule = {
  Component: ComponentType;
  loader?: RouteObject["loader"];
};

function withLazyRouteImportRecovery<T extends LazyRouteModule>(
  loadRouteModule: () => Promise<T>
) {
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
        }
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
      title
    }
  };
}
