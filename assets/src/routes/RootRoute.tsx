import { create, props, type StyleXStyles } from "@stylexjs/stylex";
import { usePreloadedQuery } from "react-relay";
import {
  NavLink,
  Outlet,
  useLoaderData,
  useMatch,
  useOutletContext
} from "react-router-dom";
import rootViewerRouteQuery, {
  type RootViewerRouteQuery
} from "../__generated__/RootViewerRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../relay/route-preload";
import { AppShell } from "../ui/components/layout/AppShell";
import { PageShell } from "../ui/components/layout/PageShell";
import { Button, type ButtonProps } from "../ui/primitives/Button";
import { AppProviders } from "../ui/providers/AppProviders";
import { RouteMetadata } from "./RouteMetadata";
import type { RootLoaderData, RootViewer } from "./root/loader";

const styles = create({
  actionGroups: {
    display: "grid",
    gap: "2rem"
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem"
  },
  link: {
    fontWeight: 600,
    textDecoration: "none"
  },
  shopperPaths: {
    display: "grid",
    gap: "0.85rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  shopperPath: {
    backgroundColor: "var(--pc-surface-muted)",
    borderBlockStart: "2px solid var(--pc-border-emphasized)",
    display: "grid",
    gap: "0.75rem",
    padding: "1rem"
  },
  shopperLink: {
    justifyContent: "center",
    minHeight: "3rem",
    width: "100%"
  },
  shopperDescription: {
    color: "var(--pc-text-secondary)",
    lineHeight: 1.5,
    margin: 0
  },
  secondaryActions: {
    borderBlockStart: "1px solid var(--pc-border-quiet)",
    paddingBlockStart: "1.25rem"
  },
  navigation: {
    alignItems: "center",
    display: "flex",
    flexWrap: {
      default: "wrap",
      "@media (max-width: 48rem)": "nowrap"
    },
    gap: "0.75rem 1rem",
    justifyContent: "space-between",
    width: "100%"
  },
  navigationLinks: {
    display: "flex",
    flexWrap: {
      default: "wrap",
      "@media (max-width: 48rem)": "nowrap"
    },
    gap: "0.75rem",
    overflowX: {
      default: "visible",
      "@media (max-width: 48rem)": "auto"
    },
    overscrollBehaviorInline: "contain",
    paddingBlockEnd: {
      default: 0,
      "@media (max-width: 48rem)": "0.25rem"
    },
    scrollbarWidth: "thin"
  },
  title: {
    flexShrink: 0,
    letterSpacing: "-0.02em",
    fontWeight: 700,
    textDecoration: "none"
  }
});

type RootOutletContext = {
  viewer: RootViewer | null;
};

type Destination = {
  end?: boolean;
  label: string;
  to: string;
};

type ShopperDestination = Destination & {
  description: string;
};

const PUBLIC_DESTINATIONS = [
  { label: "Browse products", to: "/products" },
  { label: "Merchants", to: "/merchants" },
  { label: "Offers", to: "/offers" },
  { end: true, label: "Compare products", to: "/compare" }
] as const satisfies readonly Destination[];

const AUTHENTICATED_DESTINATIONS = [
  { label: "Saved comparisons", to: "/compare/saved" },
  { label: "Affiliate setup", to: "/affiliate/setup" },
  { label: "Revenue preview", to: "/commerce/revenue" },
  { label: "API tokens", to: "/account/api-tokens" }
] as const satisfies readonly Destination[];

const SHOPPER_DESTINATIONS = [
  {
    description: "Explore the catalog and narrow by what matters.",
    label: "Browse products",
    to: "/products"
  },
  {
    description: "Line up the meaningful differences side by side.",
    label: "Compare products",
    to: "/compare"
  },
  {
    description: "Check current prices, availability, and coupons.",
    label: "Review offers",
    to: "/offers"
  }
] as const satisfies readonly ShopperDestination[];

const SECONDARY_PUBLIC_DESTINATIONS = PUBLIC_DESTINATIONS.filter(
  ({ to }) => !SHOPPER_DESTINATIONS.some((destination) => destination.to === to)
);

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
    <>
      <RouteMetadata />
      <AppProviders>
        <AppShell navigation={<PrimaryNavigation viewer={viewer} />}>
          <Outlet context={{ viewer }} />
        </AppShell>
      </AppProviders>
    </>
  );
}

function PrimaryNavigation({ viewer }: RootOutletContext) {
  return (
    <div {...props(styles.navigation)}>
      <Button asChild {...props(styles.title)}>
        <NavLink end to="/">
          Product Compare
        </NavLink>
      </Button>
      <div {...props(styles.navigationLinks)}>
        <DestinationLinks destinations={PUBLIC_DESTINATIONS} variant="ghost" />
        {viewer ? (
          <DestinationLinks destinations={AUTHENTICATED_DESTINATIONS} variant="ghost" />
        ) : null}
        <AuthLinks viewer={viewer} />
      </div>
    </div>
  );
}

export function RootRoute() {
  const { viewer } = useOutletContext<RootOutletContext>();

  return (
    <PageShell
      description="Find products, compare specifications, and review current offers before you choose what to buy."
      eyebrow="A clearer path to the right product"
      title="Product Compare"
      width="reading"
    >
      <section aria-label="Home actions" {...props(styles.actionGroups)}>
        <ShopperActions />
        <nav
          aria-label="More Product Compare actions"
          {...props(styles.actions, styles.secondaryActions)}
        >
          <DestinationLinks destinations={SECONDARY_PUBLIC_DESTINATIONS} variant="soft" />
          {viewer ? (
            <DestinationLinks destinations={AUTHENTICATED_DESTINATIONS} variant="soft" />
          ) : null}
          <AuthLinks viewer={viewer} />
        </nav>
      </section>
    </PageShell>
  );
}

function ShopperActions() {
  return (
    <nav aria-label="Shopper actions" {...props(styles.actions)}>
      <ul aria-label="Shopper paths" {...props(styles.shopperPaths)}>
        {SHOPPER_DESTINATIONS.map(({ description, label, to }) => (
          <li key={to} {...props(styles.shopperPath)}>
            <DestinationLink
              label={label}
              style={styles.shopperLink}
              to={to}
              variant="solid"
            />
            <p {...props(styles.shopperDescription)}>{description}</p>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DestinationLinks({
  destinations,
  variant = "ghost"
}: {
  destinations: readonly Destination[];
  variant?: ButtonProps["variant"];
}) {
  return destinations.map(({ end, label, to }) => (
    <DestinationLink end={end} key={to} label={label} to={to} variant={variant} />
  ));
}

function DestinationLink({
  end = false,
  label,
  style,
  to,
  variant = "ghost"
}: {
  end?: boolean;
  label: string;
  style?: StyleXStyles;
  to: string;
  variant?: ButtonProps["variant"];
}) {
  const isActive = Boolean(useMatch({ end, path: to }));

  return (
    <Button
      asChild
      data-active={String(isActive)}
      variant={isActive ? "soft" : variant}
      {...props(styles.link, style)}
    >
      <NavLink end={end} to={to}>
        {label}
      </NavLink>
    </Button>
  );
}

function AuthLinks({ viewer }: { viewer: RootViewer | null }) {
  if (viewer) {
    return (
      <Button asChild {...props(styles.link)}>
        <NavLink to="/auth/logout">Sign out</NavLink>
      </Button>
    );
  }

  return (
    <>
      <Button asChild {...props(styles.link)}>
        <NavLink to="/auth/login">Sign in</NavLink>
      </Button>
      <Button asChild {...props(styles.link)}>
        <NavLink to="/auth/register">Create account</NavLink>
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
