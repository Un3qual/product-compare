import type { RouteObject } from "react-router-dom";
import { createBrowserRouter, createMemoryRouter } from "react-router-dom";
import { RootRoute } from "./routes/root";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootRoute />
  }
];

export function createClientRouter() {
  return createBrowserRouter(routes);
}

export function createServerRouter(url: string) {
  return createMemoryRouter(routes, { initialEntries: [url] });
}
