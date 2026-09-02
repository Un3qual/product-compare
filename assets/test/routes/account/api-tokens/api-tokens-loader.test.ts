import { createRelayEnvironment, RouteLoaderGraphQLError } from "../../../../src/relay/environment";
import { createRelayRouterContext, fetchRouteQuery } from "../../../../src/relay/route-preload";
import { apiTokensLoader } from "../../../../src/routes/account/api-tokens/ApiTokensRoute";
import type { Route } from "../../../../src/routes/account/api-tokens/+types/ApiTokensRoute";
import type { GraphQLResponse } from "relay-runtime";

vi.mock("../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/relay/route-preload")>(
    "../../../../src/relay/route-preload",
  );

  return {
    ...actual,
    fetchRouteQuery: vi.fn(),
  };
});

const fetchRouteQueryMock = vi.mocked(fetchRouteQuery);
const ACTIVE_TOKEN_PREFIX = "prefix-active";

interface TestApiTokenNode {
  id: string;
  label: string | null;
  tokenPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  insertedAt: string;
}

const TOKEN_NODE: TestApiTokenNode = {
  id: "QXBpVG9rZW46MDEyMzQ1NjctODlhYi1jZGVmLTAxMjMtNDU2Nzg5YWJjZGVm",
  label: "CLI",
  tokenPrefix: ACTIVE_TOKEN_PREFIX,
  lastUsedAt: null,
  expiresAt: "2026-08-29T12:00:00Z",
  revokedAt: null,
  insertedAt: "2026-05-31T12:00:00Z",
};

beforeEach(() => {
  fetchRouteQueryMock.mockReset();
});

test("apiTokensLoader returns unauthorized state for myApiTokens UNAUTHENTICATED errors", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/account/api-tokens?status=active");

  fetchRouteQueryMock.mockRejectedValueOnce(
    new RouteLoaderGraphQLError(
      buildGraphQLResponseWithErrors([
        {
          message: "Unauthorized",
          path: ["myApiTokens"],
          extensions: {
            code: "UNAUTHENTICATED",
          },
        },
      ]),
    ),
  );

  await expect(
    apiTokensLoader(buildApiTokensLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "unauthorized",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all",
  });

  expect(fetchRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { after: null, first: 20, status: "ACTIVE" },
    { signal: request.signal },
  );
});

test("apiTokensLoader returns one page and exposes its next cursor", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/account/api-tokens?status=revoked");
  const firstPageDescriptor = apiTokensQueryDescriptor({ first: 20, status: "REVOKED" });
  fetchRouteQueryMock.mockResolvedValueOnce(
    buildFetchedApiTokenPage(
      buildApiTokenPage({
        endCursor: "cursor-1",
        hasNextPage: true,
        tokens: [TOKEN_NODE],
      }),
      firstPageDescriptor,
    ),
  );

  await expect(
    apiTokensLoader(buildApiTokensLoaderArgs({ environment, request })),
  ).resolves.toEqual({
    status: "ready",
    tokenQueries: [firstPageDescriptor],
    tokens: [TOKEN_NODE],
    tokenStatus: "revoked",
    after: null,
    hasNextPage: true,
    endCursor: "cursor-1",
  });

  expect(fetchRouteQueryMock).toHaveBeenNthCalledWith(
    1,
    environment,
    expect.anything(),
    { after: null, first: 20, status: "REVOKED" },
    { signal: request.signal },
  );
  expect(fetchRouteQueryMock).toHaveBeenCalledTimes(1);
});

test("apiTokensLoader rejects invalid pagination cursors", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.com/account/api-tokens");

  fetchRouteQueryMock.mockResolvedValueOnce(
    buildFetchedApiTokenPage(
      buildApiTokenPage({
        endCursor: null,
        hasNextPage: true,
        tokens: [TOKEN_NODE],
      }),
    ),
  );

  await expect(apiTokensLoader(buildApiTokensLoaderArgs({ environment, request }))).rejects.toThrow(
    "Invalid pagination cursor",
  );
});

test("apiTokensLoader propagates aborted requests", async () => {
  const controller = new AbortController();
  const environment = createRelayEnvironment();
  const abortReason = new Error("Route load cancelled");
  const request = buildAbortableRequest(
    "https://app.example.com/account/api-tokens",
    controller.signal,
  );

  fetchRouteQueryMock.mockImplementationOnce(() => {
    controller.abort(abortReason);

    return Promise.resolve(
      buildFetchedApiTokenPage(
        buildApiTokenPage({
          endCursor: "cursor-1",
          hasNextPage: true,
          tokens: [TOKEN_NODE],
        }),
      ),
    );
  });

  await expect(apiTokensLoader(buildApiTokensLoaderArgs({ environment, request }))).rejects.toBe(
    abortReason,
  );
});

test("apiTokensLoader normalizes non-error abort reasons", async () => {
  const controller = new AbortController();
  const environment = createRelayEnvironment();
  const request = buildAbortableRequest(
    "https://app.example.com/account/api-tokens",
    controller.signal,
  );

  fetchRouteQueryMock.mockImplementationOnce(() => {
    controller.abort("Route load cancelled");

    return Promise.resolve(
      buildFetchedApiTokenPage(
        buildApiTokenPage({
          endCursor: "cursor-1",
          hasNextPage: true,
          tokens: [TOKEN_NODE],
        }),
      ),
    );
  });

  await apiTokensLoader(buildApiTokensLoaderArgs({ environment, request })).catch((error) => {
    expect(error).toBeInstanceOf(Error);
    expect(error).toHaveProperty("message", "Route load cancelled");
  });
});

function buildApiTokensLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.com/account/api-tokens"),
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}): Route.LoaderArgs {
  return {
    request,
    params: {},
    context: createRelayRouterContext(environment),
    pattern: "/account/api-tokens",
    url: new URL(request.url),
  };
}

function buildAbortableRequest(url: string, signal: AbortSignal): Request {
  return Object.defineProperty(
    new Request(url, {
      headers: new Headers(),
    }),
    "signal",
    {
      value: signal,
    },
  );
}

function buildGraphQLResponseWithErrors(
  errors: Array<{
    message: string;
    path?: Array<string | number>;
    extensions?: {
      code: string;
    };
  }>,
): GraphQLResponse {
  return {
    errors,
  };
}

function apiTokensQueryDescriptor(variables: {
  first: number;
  after?: string;
  status: "ACTIVE" | "ALL" | "REVOKED";
}) {
  return {
    __relayQuery: {
      cacheID: "ApiTokensRouteQuery-cache-id",
      operationName: "ApiTokensRouteQuery",
      variables,
    },
  };
}

function buildApiTokenPage({
  endCursor = null,
  hasNextPage = false,
  tokens,
}: {
  endCursor?: string | null;
  hasNextPage?: boolean;
  tokens: TestApiTokenNode[];
}) {
  return {
    myApiTokens: {
      edges: tokens.map((token) => ({
        cursor: `cursor:${token.id}`,
        node: token,
      })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage: false,
        startCursor: tokens.length > 0 ? `cursor:${tokens[0].id}` : null,
        endCursor,
      },
    },
  };
}

function buildFetchedApiTokenPage(
  data: unknown,
  descriptor = apiTokensQueryDescriptor({ first: 20, status: "ALL" }),
) {
  return {
    data,
    descriptor,
    dispose: vi.fn(),
  };
}
