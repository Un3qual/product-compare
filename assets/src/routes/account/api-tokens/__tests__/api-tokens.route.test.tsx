import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../../relay/route-preload";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../route-errors";
import { ApiTokensRoute } from "../index";
import type { ApiTokenSummary, ApiTokensRouteLoaderData } from "../loader";

const {
  commitCreateMutationMock,
  commitRevokeMutationMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitCreateMutationMock: vi.fn(),
  commitRevokeMutationMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useMutationMock: vi.fn(),
  usePreloadedQueryMock: vi.fn(),
  useRoutePreloadedQueryMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useLoaderData: useLoaderDataMock
  };
});

vi.mock("react-relay", async () => {
  const actual = await vi.importActual<typeof import("react-relay")>("react-relay");

  return {
    ...actual,
    useMutation: useMutationMock,
    usePreloadedQuery: usePreloadedQueryMock
  };
});

vi.mock("../../../../relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../relay/route-preload")>(
    "../../../../relay/route-preload"
  );

  return {
    ...actual,
    useRoutePreloadedQuery: useRoutePreloadedQueryMock
  };
});

const mockedUseLoaderData = vi.mocked(useLoaderData);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUsePreloadedQuery = vi.mocked(usePreloadedQuery);
const mockedUseRoutePreloadedQuery = vi.mocked(useRoutePreloadedQuery);

const ACTIVE_TOKEN: ApiTokenSummary = {
  id: "QXBpVG9rZW46MDEyMzQ1NjctODlhYi1jZGVmLTAxMjMtNDU2Nzg5YWJjZGVm",
  label: "CLI",
  tokenPrefix: "abcdef123456",
  lastUsedAt: null,
  expiresAt: "2026-08-29T12:00:00Z",
  revokedAt: null,
  insertedAt: "2026-05-31T12:00:00Z"
};

const REVOKED_TOKEN: ApiTokenSummary = {
  id: "QXBpVG9rZW46OTg3NjU0MzItMTBhYi1jZGVmLTAxMjMtNDU2Nzg5YWJjZGVm",
  label: "Old automation",
  tokenPrefix: "fedcba654321",
  lastUsedAt: "2026-05-30T12:00:00Z",
  expiresAt: null,
  revokedAt: "2026-05-31T13:00:00Z",
  insertedAt: "2026-05-29T12:00:00Z"
};

const BUILD_BOT_TOKEN: ApiTokenSummary = {
  id: "QXBpVG9rZW46YnVpbGQtYm90LXRva2Vu",
  label: "Build bot",
  tokenPrefix: "112233aabbcc",
  lastUsedAt: null,
  expiresAt: null,
  revokedAt: null,
  insertedAt: "2026-05-30T12:00:00Z"
};

const API_TOKENS_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "ApiTokensRouteQuery",
    text: "query ApiTokensRouteQuery($first: Int!, $after: String, $status: ApiTokenStatusFilter) { myApiTokens(first: $first, after: $after, status: $status) { edges { node { id } } } }",
    variables: {
      first: 20,
      status: "ALL" as const
    }
  }
};

const API_TOKENS_QUERY_REF = {
  dispose: vi.fn(),
  variables: API_TOKENS_QUERY_DESCRIPTOR.__relayQuery.variables
};

beforeEach(() => {
  commitCreateMutationMock.mockReset();
  commitRevokeMutationMock.mockReset();
  mockedUseLoaderData.mockReset();
  mockedUseMutation.mockReset();
  mockedUsePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  mockedUseMutation.mockImplementation((mutation) => {
    const name = (mutation as { params?: { name?: string } }).params?.name;
    return [name === "RevokeApiTokenMutation" ? commitRevokeMutationMock : commitCreateMutationMock, false];
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(API_TOKENS_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildApiTokenQueryData([ACTIVE_TOKEN]) as never);
});

test("API token route prompts unauthenticated users to sign in", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "unauthorized",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  expect(screen.getByRole("heading", { name: "API tokens" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Sign in to manage API tokens.");
  expect(screen.getByRole("link", { name: "Sign in to manage API tokens" })).toHaveAttribute(
    "href",
    "/auth/login"
  );
});

test("API token route renders an empty state for authenticated users without tokens", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  expect(screen.getByRole("status")).toHaveTextContent("No API tokens yet.");
  expect(screen.queryByRole("list", { name: "API tokens" })).not.toBeInTheDocument();
});

test("API token route renders token label, prefix, expiry, last-used, created, and status", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [API_TOKENS_QUERY_DESCRIPTOR],
    tokens: [ACTIVE_TOKEN, REVOKED_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);
  mockedUsePreloadedQuery.mockReturnValue(
    buildApiTokenQueryData([ACTIVE_TOKEN, REVOKED_TOKEN]) as never
  );

  renderApiTokensRoute();

  expect(screen.getByRole("heading", { name: "API tokens" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "CLI" })).toBeInTheDocument();
  expect(screen.getByText("abcdef123456")).toBeInTheDocument();
  expect(screen.getByText("2026-08-29 12:00 UTC")).toBeInTheDocument();
  expect(screen.getByText("Never used")).toBeInTheDocument();
  expect(screen.getByText("2026-05-31 12:00 UTC")).toBeInTheDocument();
  expect(screen.getByText("Active token")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Old automation" })).toBeInTheDocument();
  expect(screen.getByText("Revoked token")).toBeInTheDocument();
});

test("API token route links status filters without losing the route path", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [],
    tokens: [ACTIVE_TOKEN],
    tokenStatus: "active"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  expect(screen.getByRole("link", { name: "All" })).toHaveAttribute(
    "href",
    "/account/api-tokens?status=all"
  );
  expect(screen.getByRole("link", { name: "Active" })).toHaveAttribute(
    "href",
    "/account/api-tokens?status=active"
  );
  expect(screen.getByRole("link", { name: "Revoked" })).toHaveAttribute(
    "href",
    "/account/api-tokens?status=revoked"
  );
});

test("create token submits label and displays the one-time plain text token", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "CLI automation" }
  });
  fireEvent.change(screen.getByLabelText("Expires at"), {
    target: { value: "2026-08-29T12:00" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create API token" }));

  await waitFor(() => {
    expect(commitCreateMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          label: "CLI automation",
          expiresAt: new Date("2026-08-29T12:00").toISOString()
        }
      })
    );
  });

  completeLatestCreateMutation(buildSuccessfulCreateResponse());

  const oneTimeRegion = await screen.findByRole("region", { name: "One-time API token" });
  expect(oneTimeRegion).toHaveTextContent("Visible only once");
  expect(oneTimeRegion).toHaveTextContent("pc_live_123456789");
});

test("create token clears the one-time token when the next create starts", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "First token" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create API token" }));

  await waitFor(() => {
    expect(commitCreateMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestCreateMutation(buildSuccessfulCreateResponse());

  expect(await screen.findByText("pc_live_123456789")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "Second token" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create API token" }));

  await waitFor(() => {
    expect(commitCreateMutationMock).toHaveBeenCalledTimes(2);
  });
  expect(screen.queryByText("pc_live_123456789")).not.toBeInTheDocument();
});

test("create token renders mutation payload errors", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "CLI automation" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create API token" }));

  await waitFor(() => {
    expect(commitCreateMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestCreateMutation({
    createApiToken: {
      plainTextToken: null,
      apiToken: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "label",
          message: "Label is too long."
        }
      ]
    }
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("Label is too long.");
  expect(screen.queryByRole("region", { name: "One-time API token" })).not.toBeInTheDocument();
});

test("create token renders a generic alert for top-level GraphQL errors", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "CLI automation" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create API token" }));

  await waitFor(() => {
    expect(commitCreateMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestCreateMutation(buildSuccessfulCreateResponse(), [{ message: "boom" }]);

  expect(await screen.findByRole("alert")).toHaveTextContent(DEFAULT_ROUTE_ERROR_MESSAGE);
  expect(screen.queryByRole("region", { name: "One-time API token" })).not.toBeInTheDocument();
});

test("revoke token commits the selected token id and updates the row status", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [API_TOKENS_QUERY_DESCRIPTOR],
    tokens: [ACTIVE_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);
  mockedUsePreloadedQuery.mockReturnValue(buildApiTokenQueryData([ACTIVE_TOKEN]) as never);

  renderApiTokensRoute();

  fireEvent.click(screen.getByRole("button", { name: "Revoke token" }));

  await waitFor(() => {
    expect(commitRevokeMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          tokenId: ACTIVE_TOKEN.id
        }
      })
    );
  });

  completeLatestRevokeMutation(buildSuccessfulRevokeResponse(ACTIVE_TOKEN));

  expect(await screen.findByText("Revoked token")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Revoke token" })).not.toBeInTheDocument();
});

test("revoke token suppresses duplicate clicks while a row is pending", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [API_TOKENS_QUERY_DESCRIPTOR],
    tokens: [ACTIVE_TOKEN, BUILD_BOT_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);
  mockedUsePreloadedQuery.mockReturnValue(
    buildApiTokenQueryData([ACTIVE_TOKEN, BUILD_BOT_TOKEN]) as never
  );

  renderApiTokensRoute();

  const revokeButtons = screen.getAllByRole("button", { name: "Revoke token" });

  fireEvent.click(revokeButtons[0]);

  await waitFor(() => {
    expect(commitRevokeMutationMock).toHaveBeenCalledTimes(1);
  });
  expect(revokeButtons[0]).toBeDisabled();
  expect(revokeButtons[1]).not.toBeDisabled();

  fireEvent.click(revokeButtons[0]);

  expect(commitRevokeMutationMock).toHaveBeenCalledTimes(1);

  fireEvent.click(revokeButtons[1]);

  await waitFor(() => {
    expect(commitRevokeMutationMock).toHaveBeenCalledTimes(2);
  });
  expect(commitRevokeMutationMock).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      variables: {
        tokenId: BUILD_BOT_TOKEN.id
      }
    })
  );
});

test("revoke token renders mutation payload errors", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [],
    tokens: [ACTIVE_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  fireEvent.click(screen.getByRole("button", { name: "Revoke token" }));

  await waitFor(() => {
    expect(commitRevokeMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestRevokeMutation({
    revokeApiToken: {
      apiToken: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "tokenId",
          message: "Token cannot be revoked."
        }
      ]
    }
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("Token cannot be revoked.");
  expect(screen.getByText("Active token")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Revoke token" })).not.toBeDisabled();
});

test("revoke token renders a generic alert for network errors", async () => {
  commitRevokeMutationMock.mockImplementation(({ onError }) => {
    onError(new Error("Network request failed: boom"));
  });
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [],
    tokens: [ACTIVE_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  fireEvent.click(screen.getByRole("button", { name: "Revoke token" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(DEFAULT_ROUTE_ERROR_MESSAGE);
  expect(screen.getByRole("button", { name: "Revoke token" })).not.toBeDisabled();
});

function renderApiTokensRoute() {
  return render(
    <MemoryRouter>
      <ApiTokensRoute />
    </MemoryRouter>
  );
}

function completeLatestCreateMutation(response: unknown, graphQLErrors?: unknown[]) {
  act(() => {
    commitCreateMutationMock.mock.calls.at(-1)?.[0]?.onCompleted(response, graphQLErrors);
  });
}

function completeLatestRevokeMutation(response: unknown, graphQLErrors?: unknown[]) {
  act(() => {
    commitRevokeMutationMock.mock.calls.at(-1)?.[0]?.onCompleted(response, graphQLErrors);
  });
}

function buildSuccessfulCreateResponse() {
  return {
    createApiToken: {
      plainTextToken: "pc_live_123456789",
      apiToken: {
        id: "QXBpVG9rZW46Y3JlYXRlZC10b2tlbg==",
        label: "CLI automation",
        tokenPrefix: "123456abcdef",
        lastUsedAt: null,
        expiresAt: "2026-08-29T12:00:00Z",
        revokedAt: null,
        insertedAt: "2026-05-31T14:00:00Z"
      },
      errors: []
    }
  };
}

function buildSuccessfulRevokeResponse(token: ApiTokenSummary) {
  return {
    revokeApiToken: {
      apiToken: {
        ...token,
        revokedAt: "2026-05-31T15:00:00Z"
      },
      errors: []
    }
  };
}

function buildApiTokenQueryData(tokens: ApiTokenSummary[]) {
  return {
    myApiTokens: {
      edges: tokens.map((token) => ({
        cursor: `cursor:${token.id}`,
        node: token
      })),
      pageInfo: {
        endCursor: tokens.length > 0 ? `cursor:${tokens[tokens.length - 1]?.id}` : null,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: tokens.length > 0 ? `cursor:${tokens[0]?.id}` : null
      }
    }
  };
}
