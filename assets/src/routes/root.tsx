import * as stylex from "@stylexjs/stylex";
import { usePreloadedQuery } from "react-relay";
import { Link, Outlet, useLoaderData, useOutletContext } from "react-router-dom";
import rootViewerRouteQuery, {
  type RootViewerRouteQuery
} from "../__generated__/RootViewerRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../relay/route-preload";
import { AppShell } from "../ui/components/layout/app-shell";
import { Button } from "../ui/primitives";
import { AppProviders } from "../ui/providers/app-providers";
import type { RootLoaderData, RootViewer } from "./root/loader";

const styles = stylex.create({
  home: {
    display: "grid",
    gap: "1rem",
    marginInline: "auto",
    maxWidth: "40rem",
    paddingBlock: "3rem",
    paddingInline: "1.5rem"
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem"
  },
  link: {
    color: "inherit",
    fontWeight: 600,
    textDecoration: "underline"
  },
  navigation: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem 1rem",
    justifyContent: "space-between"
  },
  navigationLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem"
  },
  title: {
    color: "inherit",
    fontWeight: 700,
    textDecoration: "none"
  }
});

type RootOutletContext = {
  viewer: RootViewer | null;
};

export function RootLayout() {
  const loaderData = useLoaderData() as RootLoaderData;

  if (loaderData.status === "degraded") {
    return <RootLayoutShell viewer={loaderData.viewer} />;
  }

  return <ReadyRootLayout loaderData={loaderData} />;
}

function ReadyRootLayout({
  loaderData
}: {
  loaderData: Extract<RootLoaderData, { status: "ready" }>;
}) {
  const queryRef = useRoutePreloadedQuery<RootViewerRouteQuery>(
    rootViewerRouteQuery,
    loaderData.viewerQuery
  );
  const data = usePreloadedQuery<RootViewerRouteQuery>(rootViewerRouteQuery, queryRef);

  return <RootLayoutShell viewer={rootViewerFromQuery(data.viewer)} />;
}

function RootLayoutShell({ viewer }: RootOutletContext) {
  return (
    <AppProviders>
      <AppShell
        navigation={
          <div {...stylex.props(styles.navigation)}>
            <Button asChild {...stylex.props(styles.title)}>
              <Link to="/">Product Compare</Link>
            </Button>
            <div {...stylex.props(styles.navigationLinks)}>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/products">Browse products</Link>
              </Button>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/merchants">Merchants</Link>
              </Button>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/affiliate/setup">Affiliate setup</Link>
              </Button>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/offers">Offers</Link>
              </Button>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/compare">Compare products</Link>
              </Button>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/compare/saved">Saved comparisons</Link>
              </Button>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/commerce/revenue">Revenue</Link>
              </Button>
              <Button asChild {...stylex.props(styles.link)}>
                <Link to="/account/api-tokens">API tokens</Link>
              </Button>
              <AuthLinks viewer={viewer} />
            </div>
          </div>
        }
      >
        <Outlet context={{ viewer }} />
      </AppShell>
    </AppProviders>
  );
}

export function RootRoute() {
  const { viewer } = useOutletContext<RootOutletContext>();

  return (
    <section {...stylex.props(styles.home)}>
      <div>
        <h1>Product Compare</h1>
        <p>GraphQL-backed browser auth flows now live alongside the frontend routes.</p>
      </div>
      <div aria-label="Home actions" role="group" {...stylex.props(styles.actions)}>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/products">Browse products</Link>
        </Button>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/merchants">Merchants</Link>
        </Button>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/affiliate/setup">Affiliate setup</Link>
        </Button>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/offers">Offers</Link>
        </Button>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/compare">Compare products</Link>
        </Button>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/compare/saved">Saved comparisons</Link>
        </Button>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/commerce/revenue">Revenue</Link>
        </Button>
        <Button asChild {...stylex.props(styles.link)}>
          <Link to="/account/api-tokens">API tokens</Link>
        </Button>
        <AuthLinks viewer={viewer} />
      </div>
    </section>
  );
}

function AuthLinks({ viewer }: { viewer: RootViewer | null }) {
  if (viewer) {
    return (
      <Button asChild {...stylex.props(styles.link)}>
        <Link to="/auth/logout">Sign out</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild {...stylex.props(styles.link)}>
        <Link to="/auth/login">Sign in</Link>
      </Button>
      <Button asChild {...stylex.props(styles.link)}>
        <Link to="/auth/register">Create account</Link>
      </Button>
    </>
  );
}

function rootViewerFromQuery(
  viewer: RootViewerRouteQuery["response"]["viewer"]
): RootViewer | null {
  if (!viewer) {
    return null;
  }

  return {
    id: viewer.id,
    email: viewer.email
  };
}
