export type RootDestination = {
  end?: boolean;
  label: string;
  to: string;
};

export type RootShopperDestination = RootDestination & {
  description: string;
};

export type RootDestinationViewer = {
  readonly isOperator: boolean;
};

type RootDestinationGroupKind =
  | "authenticated"
  | "auth"
  | "operator"
  | "public"
  | "secondary-public";

export type RootDestinationGroup = {
  kind: RootDestinationGroupKind;
  destinations: readonly RootDestination[];
};

export type RootShopperDestinationGroup = {
  kind: "shopper";
  destinations: readonly RootShopperDestination[];
};

export type RootDestinationData = {
  primary: readonly RootDestinationGroup[];
  home: {
    shopper: RootShopperDestinationGroup;
    secondary: readonly RootDestinationGroup[];
  };
};

const PUBLIC_DESTINATIONS = [
  { label: "Browse products", to: "/products" },
  { label: "Merchants", to: "/merchants" },
  { label: "Offers", to: "/offers" },
  { end: true, label: "Compare products", to: "/compare" }
] as const satisfies readonly RootDestination[];

const AUTHENTICATED_DESTINATIONS = [
  { label: "Price alerts", to: "/account/alerts" },
  { label: "Saved comparisons", to: "/compare/saved" },
  { label: "API tokens", to: "/account/api-tokens" }
] as const satisfies readonly RootDestination[];

const OPERATOR_DESTINATIONS = [
  { label: "Affiliate setup", to: "/affiliate/setup" },
  { label: "Revenue preview", to: "/commerce/revenue" },
  { label: "Feed candidates", to: "/ingestion/feed-candidates" }
] as const satisfies readonly RootDestination[];

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
] as const satisfies readonly RootShopperDestination[];

const SECONDARY_PUBLIC_DESTINATIONS = PUBLIC_DESTINATIONS.filter(
  ({ to }) => !SHOPPER_DESTINATIONS.some((destination) => destination.to === to)
);

const PUBLIC_GROUP = { kind: "public", destinations: PUBLIC_DESTINATIONS } as const;
const AUTHENTICATED_GROUP = {
  kind: "authenticated",
  destinations: AUTHENTICATED_DESTINATIONS
} as const;
const OPERATOR_GROUP = { kind: "operator", destinations: OPERATOR_DESTINATIONS } as const;
const SHOPPER_GROUP = { kind: "shopper", destinations: SHOPPER_DESTINATIONS } as const;
const SECONDARY_PUBLIC_GROUP = {
  kind: "secondary-public",
  destinations: SECONDARY_PUBLIC_DESTINATIONS
} as const;
const GUEST_AUTH_GROUP = {
  kind: "auth",
  destinations: [
    { label: "Sign in", to: "/auth/login" },
    { label: "Create account", to: "/auth/register" }
  ]
} as const satisfies RootDestinationGroup;
const AUTHENTICATED_AUTH_GROUP = {
  kind: "auth",
  destinations: [{ label: "Sign out", to: "/auth/logout" }]
} as const satisfies RootDestinationGroup;

export function getRootDestinationData(viewer: RootDestinationViewer | null): RootDestinationData {
  const authenticatedGroups = viewer ? [AUTHENTICATED_GROUP] : [];
  const operatorGroups = viewer?.isOperator ? [OPERATOR_GROUP] : [];
  const authGroup = viewer ? AUTHENTICATED_AUTH_GROUP : GUEST_AUTH_GROUP;

  return {
    primary: [PUBLIC_GROUP, ...authenticatedGroups, ...operatorGroups, authGroup],
    home: {
      shopper: SHOPPER_GROUP,
      secondary: [
        SECONDARY_PUBLIC_GROUP,
        ...authenticatedGroups,
        ...operatorGroups,
        authGroup
      ]
    }
  };
}
