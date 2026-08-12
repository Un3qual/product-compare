export type RootDestination = {
  end?: boolean;
  label: string;
  to: string;
};

export type RootDestinationViewer = {
  readonly isOperator: boolean;
};

export type RootDestinationSection = {
  destinations: readonly RootDestination[];
  authDestinations: readonly RootDestination[];
};

export type RootDestinationData = {
  primary: RootDestinationSection;
};

const PUBLIC_DESTINATIONS = [
  { label: "Browse products", to: "/products" },
  { label: "Merchants", to: "/merchants" },
  { label: "Offers", to: "/offers" },
  { end: true, label: "Compare products", to: "/compare" },
] as const satisfies readonly RootDestination[];

const AUTHENTICATED_DESTINATIONS = [
  { label: "Price alerts", to: "/account/alerts" },
  { label: "Saved comparisons", to: "/compare/saved" },
  { label: "API tokens", to: "/account/api-tokens" },
] as const satisfies readonly RootDestination[];

const OPERATOR_DESTINATIONS = [
  { label: "Affiliate setup", to: "/affiliate/setup" },
  { label: "Revenue preview", to: "/commerce/revenue" },
  { label: "CJ programs", to: "/ingestion/cj-programs" },
] as const satisfies readonly RootDestination[];

const GUEST_AUTH_DESTINATIONS = [
  { label: "Sign in", to: "/auth/login" },
  { label: "Create account", to: "/auth/register" },
] as const satisfies readonly RootDestination[];
const AUTHENTICATED_AUTH_DESTINATIONS = [
  { label: "Sign out", to: "/auth/logout" },
] as const satisfies readonly RootDestination[];

export function getRootDestinationData(viewer: RootDestinationViewer | null): RootDestinationData {
  const authenticatedDestinations = viewer ? AUTHENTICATED_DESTINATIONS : [];
  const operatorDestinations = viewer?.isOperator ? OPERATOR_DESTINATIONS : [];
  const authDestinations = viewer ? AUTHENTICATED_AUTH_DESTINATIONS : GUEST_AUTH_DESTINATIONS;

  return {
    primary: {
      destinations: [...PUBLIC_DESTINATIONS, ...authenticatedDestinations, ...operatorDestinations],
      authDestinations,
    },
  };
}
