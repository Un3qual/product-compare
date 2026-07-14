import { create, props, type StyleXStyles } from "@stylexjs/stylex";
import { NavLink, useMatch } from "react-router-dom";
import { Button, type ButtonProps } from "../ui/primitives/Button";
import type { RootViewer } from "./root/loader";

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
  { label: "API tokens", to: "/account/api-tokens" }
] as const satisfies readonly Destination[];

const OPERATOR_DESTINATIONS = [
  { label: "Affiliate setup", to: "/affiliate/setup" },
  { label: "Revenue preview", to: "/commerce/revenue" },
  { label: "Feed candidates", to: "/ingestion/feed-candidates" }
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

type RootDestinationsProps = {
  viewer: RootViewer | null;
};

export function RootPrimaryNavigation({ viewer }: RootDestinationsProps) {
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
        {viewer?.isOperator ? (
          <DestinationLinks destinations={OPERATOR_DESTINATIONS} variant="ghost" />
        ) : null}
        <AuthLinks viewer={viewer} />
      </div>
    </div>
  );
}

export function RootHomeDestinations({ viewer }: RootDestinationsProps) {
  return (
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
        {viewer?.isOperator ? (
          <DestinationLinks destinations={OPERATOR_DESTINATIONS} variant="soft" />
        ) : null}
        <AuthLinks viewer={viewer} />
      </nav>
    </section>
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

function AuthLinks({ viewer }: RootDestinationsProps) {
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
