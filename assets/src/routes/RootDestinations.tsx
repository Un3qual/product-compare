import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "$ui/primitives/Popover";
import { create, props, type StyleXStyles } from "@stylexjs/stylex";
import { MenuIcon, SearchIcon } from "lucide-react";
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
      "@media (max-width: 48rem)": "minmax(0, 1fr) auto",
    },
    justifyContent: "space-between",
    width: "100%",
  },
  navigationLinks: {
    alignItems: "center",
    display: { default: "flex", "@media (max-width: 48rem)": "none" },
    gap: "0.75rem",
    justifyContent: "end",
    width: "100%",
  },
  mobileNavigation: {
    alignItems: "center",
    display: { default: "none", "@media (max-width: 48rem)": "flex" },
    gap: "0.4rem",
  },
  mobileIconControl: {
    paddingInline: 0,
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
  navigationMenuPopup: {
    minWidth: "12rem",
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
    justifySelf: "start",
    maxWidth: "100%",
    paddingInline: { default: "0.9rem", "@media (max-width: 48rem)": "0.7rem" },
    width: "auto",
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
  const mobileDestinations = [
    ...primaryDestinations.filter(({ to }) => to === "/compare"),
    ...exploreDestinations,
    ...memberDestinations,
    ...operatorDestinations,
    ...(viewer ? primary.authDestinations : guestDestinations),
  ];

  useEffect(() => setOpenMenu(null), [location.pathname, location.search]);

  return (
    <div {...props(styles.navigation)}>
      <Button
        render={<NavLink end to={destinationWithComparison("/", selectedSlugs)} />}
        style={styles.title}
      >
        <CompareMark label="Product Compare" />
      </Button>
      <div data-slot="root-navigation-controls" {...props(styles.navigationLinks)}>
        <DestinationLinks
          destinations={primaryDestinations}
          preserveComparison
          searchLabel
          selectedSlugs={selectedSlugs}
          style={styles.navigationControl}
          variant="secondary"
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
      <div data-slot="root-mobile-navigation-controls" {...props(styles.mobileNavigation)}>
        <Button
          aria-label="Search products"
          render={<NavLink to={destinationWithComparison("/products", selectedSlugs)} />}
          size="icon"
          style={styles.mobileIconControl}
          variant="secondary"
        >
          <SearchIcon aria-hidden="true" size={18} />
        </Button>
        <MobileNavigationMenu
          destinations={mobileDestinations}
          onOpenChange={(open) => setOpenMenu(open ? "Menu" : null)}
          open={openMenu === "Menu"}
          selectedSlugs={selectedSlugs}
        />
      </div>
    </div>
  );
}

function MobileNavigationMenu({
  destinations,
  onOpenChange,
  open,
  selectedSlugs,
}: {
  destinations: readonly RootDestination[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  selectedSlugs: readonly string[];
}) {
  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-label="Menu"
            size="icon"
            style={styles.mobileIconControl}
            variant="secondary"
          />
        }
      >
        <MenuIcon aria-hidden="true" size={18} />
      </PopoverTrigger>
      <PopoverContent aria-label="Menu" align="end" style={styles.navigationMenuPopup}>
        <nav
          aria-label="Menu navigation"
          data-slot="navigation-menu-content"
          {...props(styles.navigationMenuContent)}
        >
          {destinations.map(({ end, label, to }) => (
            <DestinationLink
              end={end}
              key={to}
              label={label}
              matchDestination={!isAuthDestination(to)}
              onNavigate={() => onOpenChange(false)}
              preserveComparison={!isAuthDestination(to)}
              selectedSlugs={selectedSlugs}
              style={styles.menuLink}
              to={to}
              variant={isAuthDestination(to) ? "default" : "ghost"}
            />
          ))}
        </nav>
      </PopoverContent>
    </Popover>
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
      data-active={matchDestination ? String(isActive) : undefined}
      render={<NavLink end={end} onClick={onNavigate} to={destination} />}
      variant={isActive ? "secondary" : variant}
      style={[styles.link, style]}
    >
      {label}
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
      variant={isAuthDestination(to) ? "default" : "ghost"}
    />
  ));
  const menuTrigger = (
    <PopoverTrigger
      render={
        <Button
          aria-label={`${label} menu`}
          variant="secondary"
          style={styles.navigationMenuTrigger}
        />
      }
    >
      <span>{label}</span>
      <span aria-hidden>⌄</span>
    </PopoverTrigger>
  );

  return (
    <div data-slot="navigation-menu" {...props(styles.navigationMenu)}>
      <Popover onOpenChange={onOpenChange} open={open}>
        {menuTrigger}
        <PopoverContent aria-label={`${label} menu`} align="end" style={styles.navigationMenuPopup}>
          <nav
            aria-label={`${label} navigation`}
            data-slot="navigation-menu-content"
            {...props(styles.navigationMenuContent)}
          >
            {destinationLinks}
          </nav>
        </PopoverContent>
      </Popover>
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
