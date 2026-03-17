import type { RouteObject } from "react-router-dom";
import { createBrowserRouter, createMemoryRouter } from "react-router-dom";
import { LoginRoute } from "./routes/auth/login";
import { RegisterRoute } from "./routes/auth/register";
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
