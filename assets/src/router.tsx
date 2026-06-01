import type { HydrationState, RouteObject } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";
import type { Environment } from "relay-runtime";
import { createRelayRouterContext } from "./relay/route-preload";
import { ApiTokensRoute } from "./routes/account/api-tokens";
import { apiTokensLoader } from "./routes/account/api-tokens/loader";
import { AffiliateSetupRoute } from "./routes/affiliate/setup";
import { affiliateSetupLoader } from "./routes/affiliate/setup/loader";
import { ForgotPasswordRoute } from "./routes/auth/forgot-password";
import { LoginRoute } from "./routes/auth/login";
import { RegisterRoute } from "./routes/auth/register";
import { ResetPasswordRoute } from "./routes/auth/reset-password";
import { VerifyEmailRoute } from "./routes/auth/verify-email";
import { browseLoader } from "./routes/catalog/loader";
import { BrowseRoute } from "./routes/catalog/browse";
import { RevenueSummaryRoute } from "./routes/commerce/revenue";
import { revenueSummaryLoader } from "./routes/commerce/revenue/loader";
import { compareLoader } from "./routes/compare/loader";
import { savedComparisonsLoader } from "./routes/compare/saved-data";
import { CompareRoute } from "./routes/compare";
import { SavedComparisonsRoute } from "./routes/compare/saved";
import { RouteErrorBoundary } from "./routes/compare/error-boundary";
import { MerchantDirectoryRoute } from "./routes/merchants";
import { merchantDirectoryLoader } from "./routes/merchants/loader";
import { ProductDetailRoute } from "./routes/products/detail";
import { productDetailLoader } from "./routes/products/loader";
import { RootLayout, RootRoute } from "./routes/root";

declare global {
  interface Window {
    __staticRouterHydrationData?: HydrationState;
  }
}

export const routes: RouteObject[] = [
  {
    path: "/",
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

export function createClientRouter(relayEnvironment?: Environment) {
  return createBrowserRouter(routes, {
    getContext: relayEnvironment ? () => createRelayRouterContext(relayEnvironment) : undefined,
    hydrationData: typeof window === "undefined" ? undefined : window.__staticRouterHydrationData
  });
}
