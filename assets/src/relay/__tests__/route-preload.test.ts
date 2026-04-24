import type { GraphQLTaggedNode } from "react-relay";
import { createRelayEnvironment } from "../environment";
import { loadAppQuery } from "../load-query";
import {
  createRelayRouterContext,
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery
} from "../route-preload";
import { dehydrateRelayEnvironment } from "../ssr";

vi.mock("../load-query", () => ({
  loadAppQuery: vi.fn()
}));

const routeQuery = {
  kind: "Request",
  params: {
    name: "BrowseProductsRouteQuery",
    text: "query BrowseProductsRouteQuery($first: Int!) { products(first: $first) { edges { node { id } } } }"
  }
} as unknown as GraphQLTaggedNode;

beforeEach(() => {
  vi.mocked(loadAppQuery).mockReset();
});

test("dehydrateRelayEnvironment returns the populated record source", () => {
  const environment = createRelayEnvironment({
    records: {
      "client:root": { __id: "client:root", __typename: "__Root" }
    }
  });

  expect(dehydrateRelayEnvironment(environment)).toEqual(
    expect.objectContaining({
      "client:root": expect.objectContaining({ __id: "client:root" })
    })
  );
});

test("preloadRouteQuery preloads the operation and returns a serializable descriptor", () => {
  const environment = createRelayEnvironment();
  const variables = { first: 12 };

  expect(preloadRouteQuery(environment, routeQuery, variables)).toEqual({
    __relayQuery: {
      operationName: "BrowseProductsRouteQuery",
      text: expect.stringContaining("query BrowseProductsRouteQuery"),
      variables
    }
  });

  expect(loadAppQuery).toHaveBeenCalledWith(environment, routeQuery, variables);
});

test("createRelayRouterContext exposes the Relay environment to route loaders", () => {
  const environment = createRelayEnvironment();
  const context = createRelayRouterContext(environment);

  expect(getRelayEnvironmentFromRouterContext(context)).toBe(environment);
});
