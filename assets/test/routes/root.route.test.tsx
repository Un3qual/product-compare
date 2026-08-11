import { fireEvent, render, screen, within } from "@testing-library/react";
import { usePreloadedQuery } from "react-relay";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router-dom";
import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../src/relay/environment";
import {
  createRelayRouterContext,
  fetchRouteQuery,
  useRoutePreloadedQuery,
} from "../../src/relay/route-preload";
import { setRootViewer } from "../../src/routes/auth/viewer-store";
import { RootPrimaryNavigation } from "../../src/routes/RootDestinations";
import { RootLayout } from "../../src/routes/RootRoute";
import { rootLoader, type RootLoaderData } from "../../src/routes/root/loader";

const { fetchRouteQueryMock, usePreloadedQueryMock, useRoutePreloadedQueryMock } = vi.hoisted(
  () => ({
    fetchRouteQueryMock: vi.fn(),
    usePreloadedQueryMock: vi.fn(),
    useRoutePreloadedQueryMock: vi.fn(),
  }),
);

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    usePreloadedQuery: usePreloadedQueryMock,
  };
});

vi.mock("../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../src/relay/route-preload")>(
    "../../src/relay/route-preload",
  );

  return {
    ...actual,
    fetchRouteQuery: fetchRouteQueryMock,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock,
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
    variables: {},
  },
};

const guestLoaderData: Extract<RootLoaderData, { status: "ready" }> = {
  status: "ready",
  viewer: null,
  viewerQuery: ROOT_VIEWER_QUERY_DESCRIPTOR,
};

const authenticatedLoaderData: Extract<RootLoaderData, { status: "ready" }> = {
  status: "ready",
  viewer: {
    id: "viewer-1",
    email: "person@example.com",
    isOperator: true,
  },
  viewerQuery: ROOT_VIEWER_QUERY_DESCRIPTOR,
};

const readyLoaderDataWithoutSnapshotViewer: Extract<RootLoaderData, { status: "ready" }> = {
  status: "ready",
  viewer: null,
  viewerQuery: authenticatedLoaderData.viewerQuery,
};

const degradedAuthenticatedLoaderData = {
  status: "degraded",
  viewer: {
    id: "viewer-1",
    email: "person@example.com",
    isOperator: true,
  },
  viewerQuery: null,
} satisfies RootLoaderData;

function RootTestIndex() {
  return <h1>Test home</h1>;
}

beforeEach(() => {
  document.title = "";
  mockedFetchRouteQuery.mockReset();
  mockedUsePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReturnValue(ROOT_VIEWER_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue({
    viewer: {
      id: "viewer-1",
      email: "person@example.com",
      isOperator: true,
    },
  } as never);
});

function renderRootRoute(loaderData: RootLoaderData, initialEntry = "/") {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        id: "root",
        handle: {
          metadata: {
            title: "Product Compare",
            description: "Choose products with clearer specifications and current offers.",
          },
        },
        element: <RootLayout />,
        children: [
          {
            index: true,
            handle: {
              metadata: {
                title: "Product Compare",
                description: "Choose products with clearer specifications and current offers.",
              },
            },
            element: <RootTestIndex />,
          },
          {
            path: "*",
            handle: {
              metadata: {
                title: "Nested | Product Compare",
                description: "Nested route metadata.",
              },
            },
            element: <div>Nested route</div>,
          },
        ],
      },
    ],
    {
      hydrationData: {
        loaderData: {
          root: loaderData,
        },
      },
      initialEntries: [initialEntry],
    },
  );

  return render(<RouterProvider router={router} />);
}

test("primary navigation preserves the URL-backed comparison across public destinations", () => {
  render(
    <MemoryRouter initialEntries={["/?slug=model-1&slug=model-2"]}>
      <nav aria-label="Primary">
        <RootPrimaryNavigation viewer={null} />
      </nav>
    </MemoryRouter>,
  );

  const primary = screen.getByRole("navigation", { name: "Primary" });

  expect(within(primary).getByRole("link", { name: "Product Compare" })).toHaveAttribute(
    "href",
    "/?slug=model-1&slug=model-2",
  );
  expect(within(primary).getByRole("link", { name: "Search products" })).toHaveAttribute(
    "href",
    "/products?slug=model-1&slug=model-2",
  );
  expect(within(primary).getByRole("link", { name: "Compare products" })).toHaveAttribute(
    "href",
    "/compare?slug=model-1&slug=model-2",
  );

  const explore = openNavigationMenu(primary, "Explore");
  expect(within(explore).getByRole("link", { name: "Offers" })).toHaveAttribute(
    "href",
    "/offers?slug=model-1&slug=model-2",
  );
});

test("primary navigation keeps one disclosure open and dismisses it after navigation", () => {
  render(
    <MemoryRouter>
      <nav aria-label="Primary">
        <RootPrimaryNavigation viewer={null} />
      </nav>
    </MemoryRouter>,
  );

  const primary = screen.getByRole("navigation", { name: "Primary" });
  openNavigationMenu(primary, "Explore");
  expect(within(primary).getByRole("navigation", { name: "Explore navigation" })).toBeVisible();

  const guest = openNavigationMenu(primary, "Guest");
  expect(
    within(primary).queryByRole("navigation", { name: "Explore navigation" }),
  ).not.toBeInTheDocument();

  fireEvent.click(within(guest).getByRole("link", { name: "Sign in" }));
  expect(
    within(primary).queryByRole("navigation", { name: "Guest navigation" }),
  ).not.toBeInTheDocument();
});

test("primary navigation renders authenticated account actions with the exact active link", () => {
  render(
    <MemoryRouter initialEntries={["/compare/saved"]}>
      <nav aria-label="Primary">
        <RootPrimaryNavigation
          viewer={{ id: "viewer-1", email: "person@example.com", isOperator: true }}
        />
      </nav>
    </MemoryRouter>,
  );

  const primaryNavigation = screen.getByRole("navigation", { name: "Primary" });
  const accountNavigation = openNavigationMenu(primaryNavigation, "Account");
  const savedComparison = within(accountNavigation).getByRole("link", {
    name: "Saved comparisons",
  });

  expect(savedComparison).toHaveAttribute("href", "/compare/saved");
  expect(savedComparison).toHaveAttribute("aria-current", "page");
  expect(savedComparison).toHaveAttribute("data-active", "true");
  expect(within(primaryNavigation).getByRole("link", { name: "Compare products" })).toHaveAttribute(
    "data-active",
    "false",
  );
  expect(within(accountNavigation).getByRole("link", { name: "API tokens" })).toHaveAttribute(
    "href",
    "/account/api-tokens",
  );
  expect(within(accountNavigation).getByRole("link", { name: "Sign out" })).toHaveAttribute(
    "href",
    "/auth/logout",
  );
  const operatorNavigation = openNavigationMenu(primaryNavigation, "Operator");
  expect(within(operatorNavigation).getByRole("link", { name: "Affiliate setup" })).toHaveAttribute(
    "href",
    "/affiliate/setup",
  );
});

test("root destinations keep member account actions but hide operator destinations", () => {
  const member = { id: "viewer-1", email: "person@example.com", isOperator: false };
  render(
    <MemoryRouter>
      <nav aria-label="Primary">
        <RootPrimaryNavigation viewer={member} />
      </nav>
    </MemoryRouter>,
  );

  const primary = screen.getByRole("navigation", { name: "Primary" });
  const accountNavigation = openNavigationMenu(primary, "Account");
  expect(
    within(accountNavigation).getByRole("link", { name: "Saved comparisons" }),
  ).toBeInTheDocument();
  expect(within(accountNavigation).getByRole("link", { name: "API tokens" })).toBeInTheDocument();
  expect(within(primary).queryByRole("button", { name: "Operator menu" })).not.toBeInTheDocument();
});

test("root layout applies the deepest matched document metadata", async () => {
  mockedUsePreloadedQuery.mockReturnValueOnce({ viewer: null } as never);

  renderRootRoute(guestLoaderData);

  await screen.findByRole("heading", { name: "Test home" });

  expect(document.title).toBe("Product Compare");
  expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
    "content",
    "Choose products with clearer specifications and current offers.",
  );
});

test("root layout renders guest auth links in the primary navigation", async () => {
  mockedUsePreloadedQuery.mockReturnValueOnce({ viewer: null } as never);
  renderRootRoute(guestLoaderData);

  const primaryNavigation = await screen.findByRole("navigation", { name: "Primary" });

  expect(primaryNavigation).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Product Compare" })).toHaveAttribute("href", "/");
  expect(within(primaryNavigation).getByRole("link", { name: "Compare products" })).toHaveAttribute(
    "href",
    "/compare",
  );
  const exploreNavigation = openNavigationMenu(primaryNavigation, "Explore");
  expect(within(exploreNavigation).getByRole("link", { name: "Merchants" })).toHaveAttribute(
    "href",
    "/merchants",
  );
  expect(within(primaryNavigation).getByRole("link", { name: "Offers" })).toHaveAttribute(
    "href",
    "/offers",
  );
  for (const accountDestination of [
    "Saved comparisons",
    "Affiliate setup",
    "Revenue preview",
    "CJ programs",
    "API tokens",
  ]) {
    expect(
      within(primaryNavigation).queryByRole("link", { name: accountDestination }),
    ).not.toBeInTheDocument();
  }
  const guestNavigation = openNavigationMenu(primaryNavigation, "Guest");
  expect(within(guestNavigation).getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/auth/login",
  );
  expect(within(guestNavigation).getByRole("link", { name: "Create account" })).toHaveAttribute(
    "href",
    "/auth/register",
  );
  expect(
    within(primaryNavigation).queryByRole("link", { name: "Sign out" }),
  ).not.toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    guestLoaderData.viewerQuery,
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), ROOT_VIEWER_QUERY_REF);
});

test("root layout renders authenticated auth links in the primary navigation", async () => {
  renderRootRoute(authenticatedLoaderData);

  const primaryNavigation = await screen.findByRole("navigation", { name: "Primary" });
  const accountNavigation = openNavigationMenu(primaryNavigation, "Account");
  const operatorNavigation = openNavigationMenu(primaryNavigation, "Operator");

  expect(within(accountNavigation).getByRole("link", { name: "Sign out" })).toHaveAttribute(
    "href",
    "/auth/logout",
  );
  expect(
    within(accountNavigation).getByRole("link", { name: "Saved comparisons" }),
  ).toHaveAttribute("href", "/compare/saved");
  expect(within(operatorNavigation).getByRole("link", { name: "Affiliate setup" })).toHaveAttribute(
    "href",
    "/affiliate/setup",
  );
  expect(within(operatorNavigation).getByRole("link", { name: "Revenue preview" })).toHaveAttribute(
    "href",
    "/commerce/revenue",
  );
  expect(within(operatorNavigation).getByRole("link", { name: "CJ programs" })).toHaveAttribute(
    "href",
    "/ingestion/cj-programs",
  );
  expect(within(accountNavigation).getByRole("link", { name: "API tokens" })).toHaveAttribute(
    "href",
    "/account/api-tokens",
  );
  expect(
    within(primaryNavigation).queryByRole("link", { name: "Sign in" }),
  ).not.toBeInTheDocument();
  expect(
    within(primaryNavigation).queryByRole("link", { name: "Create account" }),
  ).not.toBeInTheDocument();
});

test("root layout identifies one exact active destination on saved comparisons", async () => {
  renderRootRoute(authenticatedLoaderData, "/compare/saved");

  const primaryNavigation = await screen.findByRole("navigation", { name: "Primary" });
  const accountNavigation = openNavigationMenu(primaryNavigation, "Account");
  const compareLink = within(primaryNavigation).getByRole("link", {
    name: "Compare products",
  });
  const savedLink = within(accountNavigation).getByRole("link", {
    name: "Saved comparisons",
  });

  expect(compareLink).not.toHaveAttribute("aria-current");
  expect(compareLink).toHaveAttribute("data-active", "false");
  expect(savedLink).toHaveAttribute("aria-current", "page");
  expect(savedLink).toHaveAttribute("data-active", "true");
});

test("root layout reads authenticated viewer state from the preloaded root query", async () => {
  renderRootRoute(readyLoaderDataWithoutSnapshotViewer);

  const primaryNavigation = await screen.findByRole("navigation", { name: "Primary" });
  const accountNavigation = openNavigationMenu(primaryNavigation, "Account");

  expect(within(accountNavigation).getByRole("link", { name: "Sign out" })).toHaveAttribute(
    "href",
    "/auth/logout",
  );
  expect(mockedUseRoutePreloadedQuery).toHaveBeenCalledWith(
    expect.anything(),
    readyLoaderDataWithoutSnapshotViewer.viewerQuery,
  );
  expect(mockedUsePreloadedQuery).toHaveBeenCalledWith(expect.anything(), ROOT_VIEWER_QUERY_REF);
});

test("root layout preserves cached viewer state when the root viewer preload is degraded", async () => {
  renderRootRoute(degradedAuthenticatedLoaderData);

  const primaryNavigation = await screen.findByRole("navigation", { name: "Primary" });
  const accountNavigation = openNavigationMenu(primaryNavigation, "Account");

  expect(within(accountNavigation).getByRole("link", { name: "Sign out" })).toHaveAttribute(
    "href",
    "/auth/logout",
  );
  expect(
    within(primaryNavigation).queryByRole("link", { name: "Sign in" }),
  ).not.toBeInTheDocument();
  expect(mockedUseRoutePreloadedQuery).not.toHaveBeenCalled();
  expect(mockedUsePreloadedQuery).not.toHaveBeenCalled();
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
    { signal: request.signal },
  );
});

test("rootLoader preserves the cached root viewer when the viewer preload fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/products");

  setRootViewer(environment, {
    id: "viewer-1",
    email: "person@example.com",
    isOperator: true,
  });
  mockedFetchRouteQuery.mockRejectedValueOnce(new Error("Viewer fetch failed"));

  await expect(rootLoader(buildRootLoaderArgs({ environment, request }))).resolves.toEqual({
    status: "degraded",
    viewer: {
      id: "viewer-1",
      email: "person@example.com",
      isOperator: true,
    },
    viewerQuery: null,
  });
});

function buildRootLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.com/"),
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}): LoaderFunctionArgs {
  return {
    request,
    params: {},
    context: createRelayRouterContext(environment),
    pattern: "/",
    url: new URL(request.url),
  };
}

function buildAbortableRequest(url: string, signal: AbortSignal): Request {
  return Object.defineProperty(
    new Request(url, {
      headers: new Headers(),
    }),
    "signal",
    {
      value: signal,
    },
  );
}

function openNavigationMenu(primaryNavigation: HTMLElement, label: string) {
  fireEvent.click(within(primaryNavigation).getByRole("button", { name: `${label} menu` }));
  return within(primaryNavigation).getByRole("navigation", { name: `${label} navigation` });
}
