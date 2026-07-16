import { create, props, type StyleXStyles } from "@stylexjs/stylex";
import { NavLink, useMatch } from "react-router-dom";
import { Button, type ButtonProps } from "../ui/primitives/Button";
import {
  getRootDestinationData,
  type RootDestination,
  type RootShopperDestination
} from "./root-destination-data";
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

type RootDestinationsProps = {
  viewer: RootViewer | null;
};

export function RootPrimaryNavigation({ viewer }: RootDestinationsProps) {
  const { primary } = getRootDestinationData(viewer);

  return (
    <div {...props(styles.navigation)}>
      <Button asChild {...props(styles.title)}>
        <NavLink end to="/">
          Product Compare
        </NavLink>
      </Button>
      <div {...props(styles.navigationLinks)}>
        <DestinationLinks destinations={primary.destinations} variant="ghost" />
        <AuthLinks destinations={primary.authDestinations} />
      </div>
    </div>
  );
}

export function RootHomeDestinations({ viewer }: RootDestinationsProps) {
  const { home } = getRootDestinationData(viewer);

  return (
    <section aria-label="Home actions" {...props(styles.actionGroups)}>
      <ShopperActions destinations={home.shopperDestinations} />
      <nav
        aria-label="More Product Compare actions"
        {...props(styles.actions, styles.secondaryActions)}
      >
        <DestinationLinks destinations={home.secondary.destinations} variant="soft" />
        <AuthLinks destinations={home.secondary.authDestinations} />
      </nav>
    </section>
  );
}

function ShopperActions({ destinations }: { destinations: readonly RootShopperDestination[] }) {
  return (
    <nav aria-label="Shopper actions" {...props(styles.actions)}>
      <ul aria-label="Shopper paths" {...props(styles.shopperPaths)}>
        {destinations.map(({ description, label, to }) => (
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
  destinations: readonly RootDestination[];
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

function AuthLinks({ destinations }: { destinations: readonly RootDestination[] }) {
  return destinations.map(({ label, to }) => (
    <Button asChild key={to} {...props(styles.link)}>
      <NavLink to={to}>{label}</NavLink>
    </Button>
  ));
}
