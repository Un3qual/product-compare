import type { RouteObject } from "react-router-dom";
import { createBrowserRouter, createMemoryRouter } from "react-router-dom";
import { ForgotPasswordRoute } from "./routes/auth/forgot-password";
import { LoginRoute } from "./routes/auth/login";
import { RegisterRoute } from "./routes/auth/register";
import { ResetPasswordRoute } from "./routes/auth/reset-password";
import { VerifyEmailRoute } from "./routes/auth/verify-email";
import { RootLayout, RootRoute } from "./routes/root";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <RootRoute />
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
  return createBrowserRouter(routes);
}

export function createServerRouter(url: string) {
  return createMemoryRouter(routes, { initialEntries: [normalizeServerEntry(url)] });
}

function normalizeServerEntry(url: string) {
  try {
    const parsed = new URL(url, "http://localhost");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url.startsWith("/") ? url : "/";
  }
}
