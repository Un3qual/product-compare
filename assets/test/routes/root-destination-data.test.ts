import {
  getRootDestinationData,
  type RootDestination,
} from "../../src/routes/root-destination-data";

test("guest destinations expose public routes and guest authentication actions", () => {
  const data = getRootDestinationData(null);

  expect(paths(data.primary.destinations)).toEqual([
    "/products",
    "/merchants",
    "/offers",
    "/compare",
  ]);
  expect(paths(data.primary.authDestinations)).toEqual(["/auth/login", "/auth/register"]);
});

test("authenticated members gain account routes without operator routes", () => {
  const data = getRootDestinationData({ isOperator: false });

  expect(paths(data.primary.destinations)).toEqual([
    "/products",
    "/merchants",
    "/offers",
    "/compare",
    "/account/alerts",
    "/compare/saved",
    "/account/api-tokens",
  ]);
  expect(paths(data.primary.authDestinations)).toEqual(["/auth/logout"]);
});

test("operators gain operator routes after authenticated destinations", () => {
  const data = getRootDestinationData({ isOperator: true });

  expect(paths(data.primary.destinations)).toEqual([
    "/products",
    "/merchants",
    "/offers",
    "/compare",
    "/account/alerts",
    "/compare/saved",
    "/account/api-tokens",
    "/affiliate/setup",
    "/commerce/revenue",
    "/ingestion/cj-programs",
  ]);
});

function paths(destinations: readonly RootDestination[]) {
  return destinations.map(({ to }) => to);
}
