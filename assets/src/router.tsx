import type { HydrationState, RouteObject } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";
import { ForgotPasswordRoute } from "./routes/auth/forgot-password";
import { LoginRoute } from "./routes/auth/login";
import { RegisterRoute } from "./routes/auth/register";
import { ResetPasswordRoute } from "./routes/auth/reset-password";
import { VerifyEmailRoute } from "./routes/auth/verify-email";
import { browseLoader } from "./routes/catalog/api";
import { BrowseRoute } from "./routes/catalog/browse";
import { compareLoader, savedComparisonsLoader } from "./routes/compare/api";
import { CompareRoute } from "./routes/compare";
import { SavedComparisonsRoute } from "./routes/compare/saved";
import { productDetailLoader } from "./routes/products/api";
import { ProductDetailRoute } from "./routes/products/detail";
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
        path: "compare",
        loader: compareLoader,
        element: <CompareRoute />
      },
      {
        path: "compare/saved",
        loader: savedComparisonsLoader,
        element: <SavedComparisonsRoute />
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

export function createClientRouter() {
  return createBrowserRouter(routes, {
    hydrationData: typeof window === "undefined" ? undefined : window.__staticRouterHydrationData
  });
}
