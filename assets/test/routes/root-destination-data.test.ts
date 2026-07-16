import { getRootDestinationData } from "../../src/routes/root-destination-data";

test("composes guest primary and home destination groups with the established copy and order", () => {
  expect(getRootDestinationData(null)).toEqual({
    primary: [
      {
        kind: "public",
        destinations: [
          { label: "Browse products", to: "/products" },
          { label: "Merchants", to: "/merchants" },
          { label: "Offers", to: "/offers" },
          { end: true, label: "Compare products", to: "/compare" }
        ]
      },
      {
        kind: "auth",
        destinations: [
          { label: "Sign in", to: "/auth/login" },
          { label: "Create account", to: "/auth/register" }
        ]
      }
    ],
    home: {
      shopper: {
        kind: "shopper",
        destinations: [
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
        ]
      },
      secondary: [
        {
          kind: "secondary-public",
          destinations: [
            { label: "Merchants", to: "/merchants" }
          ]
        },
        {
          kind: "auth",
          destinations: [
            { label: "Sign in", to: "/auth/login" },
            { label: "Create account", to: "/auth/register" }
          ]
        }
      ]
    }
  });
});

test("composes authenticated member groups without operator destinations", () => {
  const data = getRootDestinationData({ isOperator: false });

  expect(data.primary.map(({ kind }) => kind)).toEqual(["public", "authenticated", "auth"]);
  expect(data.home.secondary.map(({ kind }) => kind)).toEqual([
    "secondary-public",
    "authenticated",
    "auth"
  ]);
  expect(data.primary[1].destinations).toEqual([
    { label: "Price alerts", to: "/account/alerts" },
    { label: "Saved comparisons", to: "/compare/saved" },
    { label: "API tokens", to: "/account/api-tokens" }
  ]);
  expect(data.primary.at(-1)?.destinations).toEqual([{ label: "Sign out", to: "/auth/logout" }]);
});

test("composes operator groups after authenticated destinations in primary and home navigation", () => {
  const data = getRootDestinationData({ isOperator: true });

  expect(data.primary.map(({ kind }) => kind)).toEqual([
    "public",
    "authenticated",
    "operator",
    "auth"
  ]);
  expect(data.home.secondary.map(({ kind }) => kind)).toEqual([
    "secondary-public",
    "authenticated",
    "operator",
    "auth"
  ]);
  expect(data.primary[2].destinations).toEqual([
    { label: "Affiliate setup", to: "/affiliate/setup" },
    { label: "Revenue preview", to: "/commerce/revenue" },
    { label: "Feed candidates", to: "/ingestion/feed-candidates" }
  ]);
});

test("keeps viewer input unchanged while deriving the destination policy", () => {
  const viewer = { isOperator: true };
  const originalViewer = { ...viewer };

  getRootDestinationData(viewer);

  expect(viewer).toEqual(originalViewer);
});
