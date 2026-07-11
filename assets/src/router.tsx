import type { HydrationState, RouteObject, ShouldRevalidateFunctionArgs } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";
import type { Environment } from "relay-runtime";
import { createRelayRouterContext } from "./relay/route-preload";
import { ApiTokensRoute } from "./routes/account/api-tokens/ApiTokensRoute";
import { apiTokensLoader } from "./routes/account/api-tokens/loader";
import { AffiliateSetupRoute } from "./routes/affiliate/setup/AffiliateSetupRoute";
import { affiliateSetupLoader } from "./routes/affiliate/setup/loader";
import { ForgotPasswordRoute } from "./routes/auth/ForgotPasswordRoute";
import { LoginRoute } from "./routes/auth/LoginRoute";
import { LogoutRoute } from "./routes/auth/LogoutRoute";
import { RegisterRoute } from "./routes/auth/RegisterRoute";
import { ResetPasswordRoute } from "./routes/auth/ResetPasswordRoute";
import { VerifyEmailRoute } from "./routes/auth/VerifyEmailRoute";
import { browseLoader } from "./routes/catalog/loader";
import { BrowseRoute } from "./routes/catalog/BrowseRoute";
import { RevenueSummaryRoute } from "./routes/commerce/revenue/RevenueSummaryRoute";
import { revenueSummaryLoader } from "./routes/commerce/revenue/loader";
import { compareLoader } from "./routes/compare/loader";
import { savedComparisonsLoader } from "./routes/compare/saved-data";
import { CompareRoute } from "./routes/compare/CompareRoute";
import { SavedComparisonsRoute } from "./routes/compare/SavedComparisonsRoute";
import { RouteErrorBoundary } from "./routes/compare/RouteErrorBoundary";
import { FeedCandidatesRoute } from "./routes/ingestion/feed-candidates/FeedCandidatesRoute";
import { feedCandidatesLoader } from "./routes/ingestion/feed-candidates/loader";
import { MerchantDirectoryRoute } from "./routes/merchants/MerchantDirectoryRoute";
import { merchantDirectoryLoader } from "./routes/merchants/loader";
import { OfferDiscoveryRoute } from "./routes/offers/OfferDiscoveryRoute";
import { offerDiscoveryLoader } from "./routes/offers/loader";
import { ProductDetailRoute } from "./routes/products/ProductDetailRoute";
import { productDetailLoader } from "./routes/products/loader";
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
    loader: rootLoader,
    shouldRevalidate: shouldRevalidateRootLoader,
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <RootRoute />
      },
      {
        path: "products",
        loader: browseLoader,
        element: <BrowseRoute />
      },
      {
        path: "products/:slug",
        loader: productDetailLoader,
        element: <ProductDetailRoute />
      },
      {
        path: "merchants",
        loader: merchantDirectoryLoader,
        element: <MerchantDirectoryRoute />,
        errorElement: <RouteErrorBoundary resourceName="merchant directory" title="Merchants" />
      },
      {
        path: "affiliate/setup",
        loader: affiliateSetupLoader,
        element: <AffiliateSetupRoute />,
        errorElement: <RouteErrorBoundary resourceName="affiliate setup" title="Affiliate setup" />
      },
      {
        path: "offers",
        loader: offerDiscoveryLoader,
        element: <OfferDiscoveryRoute />,
        errorElement: <RouteErrorBoundary resourceName="offer discovery" title="Offers" />
      },
      {
        path: "ingestion/feed-candidates",
        loader: feedCandidatesLoader,
        element: <FeedCandidatesRoute />,
        errorElement: (
          <RouteErrorBoundary resourceName="feed candidates" title="CJ feed candidates" />
        )
      },
      {
        path: "compare",
        loader: compareLoader,
        element: <CompareRoute />,
        errorElement: <RouteErrorBoundary />
      },
      {
        path: "compare/saved",
        loader: savedComparisonsLoader,
        element: <SavedComparisonsRoute />,
        errorElement: <RouteErrorBoundary title="Saved comparisons" />
      },
      {
        path: "commerce/revenue",
        loader: revenueSummaryLoader,
        element: <RevenueSummaryRoute />,
        errorElement: <RouteErrorBoundary resourceName="revenue report" title="Revenue" />
      },
      {
        path: "account/api-tokens",
        loader: apiTokensLoader,
        element: <ApiTokensRoute />,
        errorElement: <RouteErrorBoundary resourceName="API tokens page" title="API tokens" />
      },
      {
        path: "auth/login",
        element: <LoginRoute />
      },
      {
        path: "auth/logout",
        element: <LogoutRoute />
      },
      {
        path: "auth/register",
        element: <RegisterRoute />
      },
      {
        path: "auth/forgot-password",
        element: <ForgotPasswordRoute />
      },
      {
        path: "auth/reset-password",
        element: <ResetPasswordRoute />
      },
      {
        path: "auth/verify-email",
        element: <VerifyEmailRoute />
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

function isAuthRoutePath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}
