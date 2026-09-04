import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "$ui/primitives/Popover";
import { create, props, type StyleXStyles } from "@stylexjs/stylex";
import { MenuIcon, SearchIcon } from "lucide-react";
import { NavLink, useLocation, useMatch } from "react-router";
import { CompareMark } from "$ui/components/brand/CompareMark";
import { Button } from "$ui/primitives/Button";
import { tokens } from "$ui/theme/tokens.stylex";
import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsFromSearch,
} from "./compare/paths";
import type { RootViewer } from "./root/viewer";

type RootDestination = {
  end?: boolean;
  label: string;
  to: string;
};

const PUBLIC_DESTINATIONS = [
  { label: "Browse products", to: "/products" },
  { label: "Merchants", to: "/merchants" },
  { label: "Offers", to: "/offers" },
  { end: true, label: "Compare products", to: "/compare" },
] as const satisfies readonly RootDestination[];

const MEMBER_DESTINATIONS = [
  { label: "Price alerts", to: "/account/alerts" },
  { label: "Saved comparisons", to: "/compare/saved" },
  { label: "API tokens", to: "/account/api-tokens" },
] as const satisfies readonly RootDestination[];

const OPERATOR_DESTINATIONS = [
  { label: "Affiliate setup", to: "/affiliate/setup" },
  { end: true, label: "Revenue preview", to: "/commerce/revenue" },
  { label: "Conversion ingestion", to: "/commerce/revenue/ingestion" },
  { label: "CJ programs", to: "/ingestion/cj-programs" },
] as const satisfies readonly RootDestination[];

const GUEST_DESTINATIONS = [
  { label: "Sign in", to: "/auth/login" },
  { label: "Create account", to: "/auth/register" },
] as const satisfies readonly RootDestination[];

const SIGN_OUT_DESTINATION = { label: "Sign out", to: "/auth/logout" } as const;

const styles = create({
  link: {
    alignItems: "center",
    borderBlockEndColor: "transparent",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "2px",
    color: tokens.textSecondary,
    display: "inline-flex",
    fontWeight: 600,
    minHeight: tokens.controlHeight,
    paddingInline: "0.25rem",
    textDecoration: "none",
  },
  linkActive: {
    borderBlockEndColor: tokens.actionAccent,
    color: tokens.actionAccent,
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
    borderBlockEndWidth: 0,
    justifyContent: "start",
    paddingInline: "0.65rem",
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
    alignItems: "center",
    color: tokens.text,
    display: "inline-flex",
    flexShrink: 0,
    letterSpacing: "-0.02em",
    fontWeight: 700,
    textDecoration: "none",
    justifySelf: "start",
    maxWidth: "100%",
    minHeight: tokens.controlHeight,
    paddingInline: 0,
    width: "auto",
  },
});

type RootDestinationsProps = {
  viewer: RootViewer | null;
};

export function RootPrimaryNavigation({ viewer }: RootDestinationsProps) {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const selectedSlugs = selectedCompareSlugsFromSearch(location.search);
  const primaryDestinations = PUBLIC_DESTINATIONS.filter(
    ({ to }) => to === "/products" || to === "/compare",
  );
  const exploreDestinations = PUBLIC_DESTINATIONS.filter(
    ({ to }) => to === "/offers" || to === "/merchants",
  );
  const memberDestinations = viewer ? MEMBER_DESTINATIONS : [];
  const operatorDestinations = viewer?.isOperator ? OPERATOR_DESTINATIONS : [];
  const guestDestinations = viewer ? [] : GUEST_DESTINATIONS;
  const accountDestinations = viewer ? [...MEMBER_DESTINATIONS, SIGN_OUT_DESTINATION] : [];
  const mobileDestinations = [
    ...primaryDestinations.filter(({ to }) => to === "/compare"),
    ...exploreDestinations,
    ...memberDestinations,
    ...operatorDestinations,
    ...(viewer ? [SIGN_OUT_DESTINATION] : guestDestinations),
  ];

  useEffect(() => setOpenMenu(null), [location.pathname, location.search]);

  return (
    <div {...props(styles.navigation)}>
      <NavLink end to={destinationWithComparison("/", selectedSlugs)} {...props(styles.title)}>
        <CompareMark label="Product Compare" />
      </NavLink>
      <div data-slot="root-navigation-controls" {...props(styles.navigationLinks)}>
        <DestinationLinks
          destinations={primaryDestinations}
          preserveComparison
          searchLabel
          selectedSlugs={selectedSlugs}
          style={styles.navigationControl}
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
}: {
  destinations: readonly RootDestination[];
  onNavigate?: () => void;
  preserveComparison?: boolean;
  searchLabel?: boolean;
  selectedSlugs?: readonly string[];
  style?: StyleXStyles;
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
}: {
  end?: boolean;
  label: string;
  matchDestination?: boolean;
  onNavigate?: () => void;
  preserveComparison?: boolean;
  selectedSlugs?: readonly string[];
  style?: StyleXStyles;
  to: string;
}) {
  const routeMatch = useMatch({ end, path: to });
  const isActive = matchDestination ? Boolean(routeMatch) : false;
  const destination = preserveComparison ? destinationWithComparison(to, selectedSlugs) : to;

  return (
    <NavLink
      data-active={matchDestination ? String(isActive) : undefined}
      end={end}
      onClick={onNavigate}
      to={destination}
      {...props(styles.link, isActive && styles.linkActive, style)}
    >
      {label}
    </NavLink>
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
    />
  ));
  const menuTrigger = (
    <PopoverTrigger
      render={
        <Button aria-label={`${label} menu`} variant="ghost" style={styles.navigationMenuTrigger} />
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

function destinationWithComparison(to: string, selectedSlugs: readonly string[]) {
  if (to === "/compare") return buildComparePathFromSlugs(selectedSlugs);

  return buildCurrentRoutePathWithCompareSlugs(to, "", selectedSlugs);
}

function isAuthDestination(to: string) {
  return to.startsWith("/auth/");
}
