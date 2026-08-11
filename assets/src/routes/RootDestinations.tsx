import { useEffect, useState } from "react";
import { create, props, type StyleXStyles } from "@stylexjs/stylex";
import { NavLink, useLocation, useMatch } from "react-router-dom";
import { CompareMark } from "../ui/components/brand/CompareMark";
import { Button, type ButtonProps } from "../ui/primitives/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/primitives/Collapsible";
import { tokens } from "../ui/theme/tokens.stylex";
import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsFromSearch,
} from "./compare/paths";
import {
  getRootDestinationData,
  type RootDestination,
  type RootShopperDestination,
} from "./root-destination-data";
import type { RootViewer } from "./root/loader";

const styles = create({
  actionGroups: {
    display: "grid",
    gap: "2rem",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  link: {
    fontWeight: 600,
    textDecoration: "none",
  },
  shopperPaths: {
    display: "grid",
    gap: "0.85rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  shopperPath: {
    backgroundColor: "var(--pc-surface-muted)",
    borderBlockStart: "2px solid var(--pc-border-emphasized)",
    display: "grid",
    gap: "0.75rem",
    padding: "1rem",
  },
  shopperLink: {
    justifyContent: "center",
    minHeight: "3rem",
    width: "100%",
  },
  shopperDescription: {
    color: "var(--pc-text-secondary)",
    lineHeight: 1.5,
    margin: 0,
  },
  secondaryActions: {
    borderBlockStart: "1px solid var(--pc-border-quiet)",
    paddingBlockStart: "1.25rem",
  },
  navigation: {
    alignItems: "center",
    display: "grid",
    gap: "0.5rem 1rem",
    gridTemplateColumns: {
      default: "auto minmax(0, 1fr)",
      "@media (max-width: 48rem)": "minmax(0, 1fr)",
    },
    justifyContent: "space-between",
    width: "100%",
  },
  navigationLinks: {
    alignItems: "center",
    display: {
      default: "flex",
      "@media (max-width: 48rem)": "grid",
    },
    gap: "0.75rem",
    gridTemplateColumns: {
      default: "none",
      "@media (max-width: 48rem)": "repeat(2, minmax(0, 1fr))",
    },
    justifyContent: {
      default: "end",
      "@media (max-width: 48rem)": "start",
    },
    width: "100%",
  },
  navigationMenu: {
    position: "relative",
    width: {
      default: "auto",
      "@media (max-width: 48rem)": "100%",
    },
  },
  navigationMenuTrigger: {
    backgroundColor: "transparent",
    border: `1px solid ${tokens.border}`,
    color: tokens.textSecondary,
    cursor: "pointer",
    font: "inherit",
    fontSize: "0.9rem",
    fontWeight: 700,
    minHeight: tokens.controlHeight,
    paddingInline: "0.8rem",
    width: {
      default: "auto",
      "@media (max-width: 48rem)": "100%",
    },
  },
  navigationMenuContent: {
    backgroundColor: tokens.surfaceRaised,
    border: `1px solid ${tokens.border}`,
    boxShadow: "0 0.7rem 1.6rem rgba(33, 31, 28, 0.12)",
    display: "grid",
    gap: "0.25rem",
    insetInlineEnd: {
      default: 0,
      "@media (max-width: 48rem)": "auto",
    },
    marginBlockStart: "0.35rem",
    minWidth: {
      default: "12rem",
      "@media (max-width: 48rem)": 0,
    },
    padding: "0.35rem",
    position: {
      default: "absolute",
      "@media (max-width: 48rem)": "static",
    },
    zIndex: 10,
  },
  menuLink: {
    justifyContent: "start",
    width: "100%",
  },
  navigationControl: {
    maxWidth: "100%",
    minWidth: 0,
    width: {
      default: "auto",
      "@media (max-width: 48rem)": "100%",
    },
  },
  title: {
    flexShrink: 0,
    letterSpacing: "-0.02em",
    fontWeight: 700,
    textDecoration: "none",
    width: {
      default: "auto",
      "@media (max-width: 48rem)": "100%",
    },
  },
});

type RootDestinationsProps = {
  viewer: RootViewer | null;
};

export function RootPrimaryNavigation({ viewer }: RootDestinationsProps) {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { primary } = getRootDestinationData(viewer);
  const selectedSlugs = selectedCompareSlugsFromSearch(location.search);
  const publicDestinations = primary.destinations.filter(
    ({ to }) => !isMemberDestination(to) && !isOperatorDestination(to),
  );
  const primaryDestinations = publicDestinations.filter(
    ({ to }) => to === "/products" || to === "/compare",
  );
  const exploreDestinations = publicDestinations.filter(
    ({ to }) => to === "/offers" || to === "/merchants",
  );
  const memberDestinations = primary.destinations.filter(({ to }) => isMemberDestination(to));
  const operatorDestinations = primary.destinations.filter(({ to }) => isOperatorDestination(to));
  const guestDestinations = viewer ? [] : primary.authDestinations;
  const accountDestinations = viewer ? [...memberDestinations, ...primary.authDestinations] : [];

  useEffect(() => setOpenMenu(null), [location.pathname, location.search]);

  return (
    <div {...props(styles.navigation)}>
      <Button asChild {...props(styles.title)}>
        <NavLink end to={destinationWithComparison("/", selectedSlugs)}>
          <CompareMark label="Product Compare" />
        </NavLink>
      </Button>
      <div data-slot="root-navigation-controls" {...props(styles.navigationLinks)}>
        <DestinationLinks
          destinations={primaryDestinations}
          preserveComparison
          searchLabel
          selectedSlugs={selectedSlugs}
          style={styles.navigationControl}
          variant="soft"
        />
        <NavigationMenu
          destinations={exploreDestinations}
          label="Explore"
          onOpenChange={(open) => setOpenMenu(open ? "Explore" : null)}
          open={openMenu === "Explore"}
          preserveComparison
          selectedSlugs={selectedSlugs}
        />
        {guestDestinations.length > 0 ? (
          <NavigationMenu
            destinations={guestDestinations}
            label="Guest"
            onOpenChange={(open) => setOpenMenu(open ? "Guest" : null)}
            open={openMenu === "Guest"}
            selectedSlugs={selectedSlugs}
          />
        ) : null}
        {accountDestinations.length > 0 ? (
          <NavigationMenu
            destinations={accountDestinations}
            label="Account"
            onOpenChange={(open) => setOpenMenu(open ? "Account" : null)}
            open={openMenu === "Account"}
            selectedSlugs={selectedSlugs}
          />
        ) : null}
        {operatorDestinations.length > 0 ? (
          <NavigationMenu
            destinations={operatorDestinations}
            label="Operator"
            onOpenChange={(open) => setOpenMenu(open ? "Operator" : null)}
            open={openMenu === "Operator"}
            selectedSlugs={selectedSlugs}
          />
        ) : null}
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
            <DestinationLink label={label} style={styles.shopperLink} to={to} variant="solid" />
            <p {...props(styles.shopperDescription)}>{description}</p>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DestinationLinks({
  destinations,
  onNavigate,
  preserveComparison = false,
  searchLabel = false,
  selectedSlugs = [],
  style,
  variant = "ghost",
}: {
  destinations: readonly RootDestination[];
  onNavigate?: () => void;
  preserveComparison?: boolean;
  searchLabel?: boolean;
  selectedSlugs?: readonly string[];
  style?: StyleXStyles;
  variant?: ButtonProps["variant"];
}) {
  return destinations.map(({ end, label, to }) => (
    <DestinationLink
      end={end}
      key={to}
      label={searchLabel && to === "/products" ? "Search products" : label}
      onNavigate={onNavigate}
      preserveComparison={preserveComparison}
      selectedSlugs={selectedSlugs}
      style={style}
      to={to}
      variant={variant}
    />
  ));
}

function DestinationLink({
  end = false,
  label,
  matchDestination = true,
  onNavigate,
  preserveComparison = false,
  selectedSlugs = [],
  style,
  to,
  variant = "ghost",
}: {
  end?: boolean;
  label: string;
  matchDestination?: boolean;
  onNavigate?: () => void;
  preserveComparison?: boolean;
  selectedSlugs?: readonly string[];
  style?: StyleXStyles;
  to: string;
  variant?: ButtonProps["variant"];
}) {
  const routeMatch = useMatch({ end, path: to });
  const isActive = matchDestination ? Boolean(routeMatch) : false;
  const destination = preserveComparison ? destinationWithComparison(to, selectedSlugs) : to;

  return (
    <Button
      asChild
      data-active={matchDestination ? String(isActive) : undefined}
      variant={isActive ? "soft" : variant}
      {...props(styles.link, style)}
    >
      <NavLink end={end} onClick={onNavigate} to={destination}>
        {label}
      </NavLink>
    </Button>
  );
}

function NavigationMenu({
  destinations,
  label,
  onOpenChange,
  open,
  preserveComparison = false,
  selectedSlugs,
}: {
  destinations: readonly RootDestination[];
  label: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  preserveComparison?: boolean;
  selectedSlugs: readonly string[];
}) {
  return (
    <Collapsible
      data-slot="navigation-menu"
      onOpenChange={onOpenChange}
      open={open}
      {...props(styles.navigationMenu)}
    >
      <CollapsibleTrigger asChild>
        <Button
          aria-label={`${label} menu`}
          variant="soft"
          {...props(styles.navigationMenuTrigger)}
        >
          {label}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent {...props(styles.navigationMenuContent)}>
        <nav aria-label={`${label} navigation`}>
          {destinations.map(({ end, label: destinationLabel, to }) => (
            <DestinationLink
              end={end}
              key={to}
              label={destinationLabel}
              matchDestination={!isAuthDestination(to)}
              onNavigate={() => onOpenChange(false)}
              preserveComparison={preserveComparison}
              selectedSlugs={selectedSlugs}
              style={styles.menuLink}
              to={to}
              variant={isAuthDestination(to) ? "solid" : "ghost"}
            />
          ))}
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AuthLinks({ destinations }: { destinations: readonly RootDestination[] }) {
  return destinations.map(({ label, to }) => (
    <Button asChild key={to} {...props(styles.link)}>
      <NavLink to={to}>{label}</NavLink>
    </Button>
  ));
}

function isMemberDestination(to: string) {
  return to === "/account/alerts" || to === "/compare/saved" || to === "/account/api-tokens";
}

function destinationWithComparison(to: string, selectedSlugs: readonly string[]) {
  if (to === "/compare") return buildComparePathFromSlugs(selectedSlugs);

  return buildCurrentRoutePathWithCompareSlugs(to, "", selectedSlugs);
}

function isOperatorDestination(to: string) {
  return to === "/affiliate/setup" || to === "/commerce/revenue" || to === "/ingestion/cj-programs";
}

function isAuthDestination(to: string) {
  return to.startsWith("/auth/");
}
