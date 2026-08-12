import { useEffect, useState } from "react";
import { Popover } from "@radix-ui/themes";
import { create, props, type StyleXStyles } from "@stylexjs/stylex";
import { NavLink, useLocation, useMatch } from "react-router-dom";
import { CompareMark } from "$ui/components/brand/CompareMark";
import { Button, type ButtonProps } from "$ui/primitives/Button";
import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsFromSearch,
} from "./compare/paths";
import { getRootDestinationData, type RootDestination } from "./root-destination-data";
import type { RootViewer } from "./root/viewer-data";

const styles = create({
  link: {
    fontWeight: 600,
    textDecoration: "none",
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
    width: {
      default: "auto",
      "@media (max-width: 48rem)": "100%",
    },
  },
  navigationMenuTrigger: {
    justifyContent: "space-between",
    width: {
      default: "auto",
      "@media (max-width: 48rem)": "100%",
    },
  },
  navigationMenuContent: {
    display: "grid",
    gap: "0.25rem",
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
  const destinationLinks = destinations.map(({ end, label: destinationLabel, to }) => (
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
  ));
  const menuTrigger = (
    <Popover.Trigger>
      <Button
        aria-label={`${label} menu`}
        variant="soft"
        {...props(styles.navigationMenuTrigger)}
      >
        <span>{label}</span>
        <span aria-hidden>⌄</span>
      </Button>
    </Popover.Trigger>
  );

  return (
    <div data-slot="navigation-menu" {...props(styles.navigationMenu)}>
      <Popover.Root onOpenChange={onOpenChange} open={open}>
        {menuTrigger}
        <Popover.Content aria-label={`${label} menu`} align="end" minWidth="12rem" size="1">
          <nav
            aria-label={`${label} navigation`}
            data-slot="navigation-menu-content"
            {...props(styles.navigationMenuContent)}
          >
            {destinationLinks}
          </nav>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
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
