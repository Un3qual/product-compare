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
        loader: browseLoader,
        element: <BrowseRoute />
      },
      {
        path: "products/:slug",
        handle: routeMetadata(
          "Product details | Product Compare",
          "Review product specifications, current offers, and price history."
        ),
        loader: productDetailLoader,
        element: <ProductDetailRoute />
      },
      {
        path: "merchants",
        handle: routeMetadata(
          "Merchants | Product Compare",
          "Browse merchants represented in current Product Compare offers."
        ),
        loader: merchantDirectoryLoader,
        element: <MerchantDirectoryRoute />,
        errorElement: <RouteErrorBoundary resourceName="merchant directory" title="Merchants" />
      },
      {
        path: "affiliate/setup",
        handle: routeMetadata(
          "Affiliate setup | Product Compare",
          "Configure merchant affiliate programs used for outbound offer links."
        ),
        loader: affiliateSetupLoader,
        element: <AffiliateSetupRoute />,
        errorElement: <RouteErrorBoundary resourceName="affiliate setup" title="Affiliate setup" />
      },
      {
        path: "offers",
        handle: routeMetadata(
          "Offers | Product Compare",
          "Discover current product offers, coupons, and merchant availability."
        ),
        loader: offerDiscoveryLoader,
        element: <OfferDiscoveryRoute />,
        errorElement: <RouteErrorBoundary resourceName="offer discovery" title="Offers" />
      },
      {
        path: "ingestion/feed-candidates",
        handle: routeMetadata(
          "CJ feed candidates | Product Compare",
          "Review CJ feed candidates before importing products and offers."
        ),
        loader: feedCandidatesLoader,
        element: <FeedCandidatesRoute />,
        errorElement: (
          <RouteErrorBoundary resourceName="feed candidates" title="CJ feed candidates" />
        )
      },
      {
        path: "compare",
        handle: routeMetadata(
          "Compare products | Product Compare",
          "Compare loaded products by specifications and current offers."
        ),
        loader: compareLoader,
        element: <CompareRoute />,
        errorElement: <RouteErrorBoundary />
      },
      {
        path: "compare/saved",
        handle: routeMetadata(
          "Saved comparisons | Product Compare",
          "Return to product comparisons saved to your account."
        ),
        loader: savedComparisonsLoader,
        element: <SavedComparisonsRoute />,
        errorElement: <RouteErrorBoundary title="Saved comparisons" />
      },
      {
        path: "commerce/revenue",
        handle: routeMetadata(
          "Revenue preview | Product Compare",
          "Preview attributed commerce revenue and commission summaries."
        ),
        loader: revenueSummaryLoader,
        element: <RevenueSummaryRoute />,
        errorElement: <RouteErrorBoundary resourceName="revenue report" title="Revenue" />
      },
      {
        path: "account/api-tokens",
        handle: routeMetadata(
          "API tokens | Product Compare",
          "Create and manage API tokens for connected Product Compare tools."
        ),
        loader: apiTokensLoader,
        element: <ApiTokensRoute />,
        errorElement: <RouteErrorBoundary resourceName="API tokens page" title="API tokens" />
      },
      {
        path: "auth/login",
        handle: routeMetadata(
          "Sign in | Product Compare",
          "Sign in to manage saved comparisons and account tools."
        ),
        element: <LoginRoute />
      },
      {
        path: "auth/logout",
        handle: routeMetadata(
          "Sign out | Product Compare",
          "Sign out of your Product Compare account."
        ),
        element: <LogoutRoute />
      },
      {
        path: "auth/register",
        handle: routeMetadata(
          "Create account | Product Compare",
          "Create an account to save comparisons and manage connected tools."
        ),
        element: <RegisterRoute />
      },
      {
        path: "auth/forgot-password",
        handle: routeMetadata(
          "Forgot password | Product Compare",
          "Request a secure Product Compare password reset link."
        ),
        element: <ForgotPasswordRoute />
      },
      {
        path: "auth/reset-password",
        handle: routeMetadata(
          "Reset password | Product Compare",
          "Choose a new password for your Product Compare account."
        ),
        element: <ResetPasswordRoute />
      },
      {
        path: "auth/verify-email",
        handle: routeMetadata(
          "Verify email | Product Compare",
          "Verify the email address connected to your Product Compare account."
        ),
        element: <VerifyEmailRoute />
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
