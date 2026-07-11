import { render, screen, within } from "@testing-library/react";
import { usePreloadedQuery } from "react-relay";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../src/relay/environment";
import {
  createRelayRouterContext,
  fetchRouteQuery,
  useRoutePreloadedQuery
} from "../../src/relay/route-preload";
import { setRootViewer } from "../../src/routes/auth/viewer-store";
import { RootLayout, RootRoute } from "../../src/routes/root";
import { rootLoader, type RootLoaderData } from "../../src/routes/root/loader";

const { fetchRouteQueryMock, usePreloadedQueryMock, useRoutePreloadedQueryMock } = vi.hoisted(
  () => ({
    fetchRouteQueryMock: vi.fn(),
    usePreloadedQueryMock: vi.fn(),
    useRoutePreloadedQueryMock: vi.fn()
  })
);

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../src/relay/route-preload")>(
    "../../src/relay/route-preload"
  );

  return {
    ...actual,
    fetchRouteQuery: fetchRouteQueryMock,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

const mockedFetchRouteQuery = vi.mocked(fetchRouteQuery);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const ROOT_VIEWER_QUERY_REF = { dispose: vi.fn() };
const ROOT_VIEWER_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "RootViewerRouteQuery",
    text: null,
    variables: {}
  }
};

const guestLoaderData: Extract<RootLoaderData, { status: "ready" }> = {
  status: "ready",
  viewer: null,
  viewerQuery: ROOT_VIEWER_QUERY_DESCRIPTOR
};

const authenticatedLoaderData: Extract<RootLoaderData, { status: "ready" }> = {
  status: "ready",
  viewer: {
    id: "viewer-1",
    email: "person@example.com"
  },
  viewerQuery: ROOT_VIEWER_QUERY_DESCRIPTOR
};

const readyLoaderDataWithoutSnapshotViewer: Extract<RootLoaderData, { status: "ready" }> = {
  status: "ready",
  viewer: null,
  viewerQuery: authenticatedLoaderData.viewerQuery
};

const degradedAuthenticatedLoaderData = {
  status: "degraded",
  viewer: {
    id: "viewer-1",
    email: "person@example.com"
  },
  viewerQuery: null
} satisfies RootLoaderData;

beforeEach(() => {
  mockedFetchRouteQuery.mockReset();
  mockedUsePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReturnValue(ROOT_VIEWER_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue({
    viewer: {
      id: "viewer-1",
      email: "person@example.com"
    }
  } as never);
});

function renderRootRoute(loaderData: RootLoaderData) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        id: "root",
        element: <RootLayout />,
        children: [
          {
            index: true,
            element: <RootRoute />
          }
        ]
      }
    ],
    {
      hydrationData: {
        loaderData: {
          root: loaderData
        }
      },
      initialEntries: ["/"]
    }
  );

  return render(<RouterProvider router={router} />);
}

test("root layout renders guest auth links in the primary navigation", async () => {
  mockedUsePreloadedQuery.mockReturnValueOnce({ viewer: null } as never);
  renderRootRoute(guestLoaderData);

  const primaryNavigation = await screen.findByRole("navigation", { name: "Primary" });

  expect(primaryNavigation).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Product Compare" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Compare products" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Merchants" })).toHaveAttribute(
    "href",
    "/merchants"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Offers" })).toHaveAttribute(
    "href",
    "/offers"
  );
  for (const accountDestination of [
    "Saved comparisons",
    "Affiliate setup",
    "Revenue preview",
    "API tokens"
  ]) {
    expect(
      within(primaryNavigation).queryByRole("link", { name: accountDestination })
    ).not.toBeInTheDocument();
  }
  expect(within(primaryNavigation).getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/auth/login"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Create account" })).toHaveAttribute(
    "href",
    "/auth/register"
  );
  expect(within(primaryNavigation).queryByRole("link", { name: "Sign out" })).not.toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    guestLoaderData.viewerQuery
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), ROOT_VIEWER_QUERY_REF);
});

test("root layout renders authenticated auth links in the primary navigation", async () => {
  renderRootRoute(authenticatedLoaderData);

  const primaryNavigation = await screen.findByRole("navigation", { name: "Primary" });

  expect(within(primaryNavigation).getByRole("link", { name: "Sign out" })).toHaveAttribute(
    "href",
    "/auth/logout"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Saved comparisons" })).toHaveAttribute(
    "href",
    "/compare/saved"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Affiliate setup" })).toHaveAttribute(
    "href",
    "/affiliate/setup"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Revenue preview" })).toHaveAttribute(
    "href",
    "/commerce/revenue"
  );
  expect(within(primaryNavigation).getByRole("link", { name: "API tokens" })).toHaveAttribute(
    "href",
    "/account/api-tokens"
  );
  expect(within(primaryNavigation).queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  expect(
    within(primaryNavigation).queryByRole("link", { name: "Create account" })
  ).not.toBeInTheDocument();
});

test("root layout reads authenticated viewer state from the preloaded root query", async () => {
  renderRootRoute(readyLoaderDataWithoutSnapshotViewer);

  const primaryNavigation = await screen.findByRole("navigation", { name: "Primary" });

  expect(within(primaryNavigation).getByRole("link", { name: "Sign out" })).toHaveAttribute(
    "href",
    "/auth/logout"
  );
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    readyLoaderDataWithoutSnapshotViewer.viewerQuery
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), ROOT_VIEWER_QUERY_REF);
});

test("root route renders guest home actions as links while using the shared button wrapper", async () => {
  mockedUsePreloadedQuery.mockReturnValueOnce({ viewer: null } as never);
  renderRootRoute(guestLoaderData);

  expect(await screen.findByRole("heading", { name: "Product Compare" })).toBeInTheDocument();
  const homeActions = screen.getByRole("group", { name: "Home actions" });

  expect(within(homeActions).getByRole("link", { name: "Browse products" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(within(homeActions).getByRole("link", { name: "Compare products" })).toHaveAttribute(
    "data-slot",
    "button"
  );
  expect(within(homeActions).getByRole("link", { name: "Merchants" })).toHaveAttribute(
    "href",
    "/merchants"
  );
  expect(within(homeActions).getByRole("link", { name: "Review offers" })).toHaveAttribute(
    "href",
    "/offers"
  );
  for (const accountDestination of [
    "Saved comparisons",
    "Affiliate setup",
    "Revenue preview",
    "API tokens"
  ]) {
    expect(
      within(homeActions).queryByRole("link", { name: accountDestination })
    ).not.toBeInTheDocument();
  }
  expect(within(homeActions).getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/auth/login"
  );
  expect(within(homeActions).getByRole("link", { name: "Create account" })).toHaveAttribute(
    "href",
    "/auth/register"
  );
  expect(within(homeActions).queryByRole("link", { name: "Sign out" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Browse products" })).not.toBeInTheDocument();
});

test("root route focuses the home content on the shopper journey", async () => {
  mockedUsePreloadedQuery.mockReturnValueOnce({ viewer: null } as never);
  renderRootRoute(guestLoaderData);

  expect(await screen.findByText(/find products/i)).toBeInTheDocument();
  expect(screen.getByText(/compare specifications/i)).toBeInTheDocument();
  expect(screen.getByText(/review current offers/i)).toBeInTheDocument();
  expect(
    screen.queryByText(/GraphQL-backed browser auth flows/i)
  ).not.toBeInTheDocument();

  const shopperActions = screen.getByRole("group", { name: "Shopper actions" });

  expect(within(shopperActions).getByRole("link", { name: "Browse products" })).toHaveAttribute(
    "href",
    "/products"
  );
  expect(within(shopperActions).getByRole("link", { name: "Compare products" })).toHaveAttribute(
    "href",
    "/compare"
  );
  expect(within(shopperActions).getByRole("link", { name: "Review offers" })).toHaveAttribute(
    "href",
    "/offers"
  );
});

test("root layout preserves cached viewer state when the root viewer preload is degraded", async () => {
  renderRootRoute(degradedAuthenticatedLoaderData);

  const primaryNavigation = await screen.findByRole("navigation", { name: "Primary" });

  expect(within(primaryNavigation).getByRole("link", { name: "Sign out" })).toHaveAttribute(
    "href",
    "/auth/logout"
  );
  expect(within(primaryNavigation).queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
});

test("root route renders authenticated home actions", async () => {
  renderRootRoute(authenticatedLoaderData);

  expect(await screen.findByRole("heading", { name: "Product Compare" })).toBeInTheDocument();
  const homeActions = screen.getByRole("group", { name: "Home actions" });

  expect(within(homeActions).getByRole("link", { name: "Sign out" })).toHaveAttribute(
    "href",
    "/auth/logout"
  );
  expect(within(homeActions).getByRole("link", { name: "Saved comparisons" })).toHaveAttribute(
    "href",
    "/compare/saved"
  );
  expect(within(homeActions).getByRole("link", { name: "Affiliate setup" })).toHaveAttribute(
    "href",
    "/affiliate/setup"
  );
  expect(within(homeActions).getByRole("link", { name: "Revenue preview" })).toHaveAttribute(
    "href",
    "/commerce/revenue"
  );
  expect(within(homeActions).getByRole("link", { name: "API tokens" })).toHaveAttribute(
    "href",
    "/account/api-tokens"
  );
  expect(within(homeActions).queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  expect(within(homeActions).queryByRole("link", { name: "Create account" })).not.toBeInTheDocument();
});

test("rootLoader propagates aborted viewer preloads instead of falling back to guest", async () => {
  const controller = new AbortController();
  const environment = createRelayEnvironment();
  const abortReason = new Error("Route load cancelled");
  const request = buildAbortableRequest("https://app.example.com/", controller.signal);

  mockedFetchRouteQuery.mockImplementationOnce(() => {
    controller.abort(abortReason);

    return Promise.reject(new Error("Viewer fetch cancelled"));
  });

  await expect(rootLoader(buildRootLoaderArgs({ environment, request }))).rejects.toBe(abortReason);
  expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {},
    { signal: request.signal }
  );
});

test("rootLoader preserves the cached root viewer when the viewer preload fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products");

  setRootViewer(environment, {
    id: "viewer-1",
    email: "person@example.com"
  });
  mockedFetchRouteQuery.mockRejectedValueOnce(new Error("Viewer fetch failed"));

  await expect(rootLoader(buildRootLoaderArgs({ environment, request }))).resolves.toEqual({
    status: "degraded",
    viewer: {
      id: "viewer-1",
      email: "person@example.com"
    },
    viewerQuery: null
  });
});

function buildRootLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.com/")
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}): LoaderFunctionArgs {
  return {
    request,
    params: {},
    context: createRelayRouterContext(environment)
  } as LoaderFunctionArgs;
}

function buildAbortableRequest(url: string, signal: AbortSignal): Request {
  return Object.defineProperty(
    new Request(url, {
      headers: new Headers()
    }),
    "signal",
    {
      value: signal
    }
  );
}
