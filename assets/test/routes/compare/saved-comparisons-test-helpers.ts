import type { GraphQLResponse } from "relay-runtime";
import { createRelayEnvironment, RouteLoaderGraphQLError } from "../../../src/relay/environment";
import { createRelayRouterContext } from "../../../src/relay/route-preload";

type TestGraphQLError = {
  message: string;
  path?: Array<string | number>;
  extensions?: {
    code: string;
  };
};

export type DeleteSavedComparisonSetMutationResponse = {
  deleteSavedComparisonSet: {
    savedComparisonSet: {
      id: string;
    } | null;
    errors: Array<{
      code: string;
      field: string | null;
      message: string;
    }>;
  };
};

export const buildSuccessfulDeleteResponse = (
  savedComparisonSetId: string,
): DeleteSavedComparisonSetMutationResponse => ({
  deleteSavedComparisonSet: {
    savedComparisonSet: {
      id: savedComparisonSetId,
    },
    errors: [],
  },
});

export const buildGraphQLResponseWithErrors = (errors: TestGraphQLError[]): GraphQLResponse => ({
  errors,
});

export const buildRouteLoaderGraphQLError = (errors: TestGraphQLError[]) =>
  new RouteLoaderGraphQLError(buildGraphQLResponseWithErrors(errors));

export const buildCompareLoaderArgs = ({
  environment,
  request = new Request("https://app.example.com/compare"),
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}) => ({
  request,
  params: {},
  context: createRelayRouterContext(environment ?? createRelayEnvironment()),
  pattern: "/compare",
  url: new URL(request.url),
});

export const buildAbortableRequest = (url: string, signal: AbortSignal) =>
  Object.defineProperty(
    new Request(url, {
      headers: new Headers(),
    }),
    "signal",
    {
      value: signal,
    },
  );

export const buildSavedComparisonsLoaderArgs = ({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.com/compare/saved"),
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}) => ({
  request,
  params: {},
  context: createRelayRouterContext(environment),
  pattern: "/compare/saved",
  url: new URL(request.url),
});
