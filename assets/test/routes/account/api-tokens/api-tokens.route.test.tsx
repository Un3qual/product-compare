import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import { useRoutePreloadedQuery } from "../../../../src/relay/route-preload";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../../src/routes/route-errors";
import {
  ApiTokensRoute,
  buildApiTokenExpiresAtInputValue
} from "../../../../src/routes/account/api-tokens/index";
import type { ApiTokenSummary, ApiTokensRouteLoaderData } from "../../../../src/routes/account/api-tokens/loader";

const {
  commitCreateMutationMock,
  commitRevokeMutationMock,
  commitRotateMutationMock,
  useLoaderDataMock,
  useMutationMock,
  usePreloadedQueryMock,
  useRoutePreloadedQueryMock
} = vi.hoisted(() => ({
  commitCreateMutationMock: vi.fn(),
  commitRevokeMutationMock: vi.fn(),
  commitRotateMutationMock: vi.fn(),
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

vi.mock("../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/relay/route-preload")>(
    "../../../../src/relay/route-preload"
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
const ACTIVE_TOKEN_PREFIX = "prefix-active";
const REVOKED_TOKEN_PREFIX = "prefix-revoked";
const BUILD_TOKEN_PREFIX = "prefix-build";
const EXPIRED_TOKEN_PREFIX = "prefix-expired";
const CREATED_TOKEN_PREFIX = "prefix-created";
const ROTATED_TOKEN_PREFIX = "prefix-rotated";
const ONE_TIME_TOKEN_VALUE = ["example", "one", "time", "api", "value"].join("-");
const ROTATED_TOKEN_VALUE = ["example", "rotated", "api", "value"].join("-");

const ACTIVE_TOKEN: ApiTokenSummary = {
  id: "QXBpVG9rZW46MDEyMzQ1NjctODlhYi1jZGVmLTAxMjMtNDU2Nzg5YWJjZGVm",
  label: "CLI",
  tokenPrefix: ACTIVE_TOKEN_PREFIX,
  lastUsedAt: null,
  expiresAt: "2026-08-29T12:00:00Z",
  revokedAt: null,
  insertedAt: "2026-05-31T12:00:00Z"
};

const REVOKED_TOKEN: ApiTokenSummary = {
  id: "QXBpVG9rZW46OTg3NjU0MzItMTBhYi1jZGVmLTAxMjMtNDU2Nzg5YWJjZGVm",
  label: "Old automation",
  tokenPrefix: REVOKED_TOKEN_PREFIX,
  lastUsedAt: "2026-05-30T12:00:00Z",
  expiresAt: null,
  revokedAt: "2026-05-31T13:00:00Z",
  insertedAt: "2026-05-29T12:00:00Z"
};

const BUILD_BOT_TOKEN: ApiTokenSummary = {
  id: "QXBpVG9rZW46YnVpbGQtYm90LXRva2Vu",
  label: "Build bot",
  tokenPrefix: BUILD_TOKEN_PREFIX,
  lastUsedAt: null,
  expiresAt: null,
  revokedAt: null,
  insertedAt: "2026-05-30T12:00:00Z"
};

const EXPIRED_TOKEN: ApiTokenSummary = {
  id: "QXBpVG9rZW46ZXhwaXJlZC10b2tlbg==",
  label: "Expired token",
  tokenPrefix: EXPIRED_TOKEN_PREFIX,
  lastUsedAt: null,
  expiresAt: "2000-01-01T00:00:00Z",
  revokedAt: null,
  insertedAt: "2026-05-28T12:00:00Z"
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

const ROUTE_NOW = Date.parse("2026-06-01T00:00:00Z");

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(ROUTE_NOW);
  commitCreateMutationMock.mockReset();
  commitRevokeMutationMock.mockReset();
  commitRotateMutationMock.mockReset();
  mockedUseLoaderData.mockReset();
  mockedUseMutation.mockReset();
  mockedUsePreloadedQuery.mockReset();
  mockedUseRoutePreloadedQuery.mockReset();
  mockedUseMutation.mockImplementation((mutation) => {
    const name = (mutation as { params?: { name?: string } }).params?.name;
    if (name === "RevokeApiTokenMutation") {
      return [commitRevokeMutationMock, false];
    }

    if (name === "RotateApiTokenMutation") {
      return [commitRotateMutationMock, false];
    }

    return [commitCreateMutationMock, false];
  });
  mockedUseRoutePreloadedQuery.mockReturnValue(API_TOKENS_QUERY_REF as never);
  mockedUsePreloadedQuery.mockReturnValue(buildApiTokenQueryData([ACTIVE_TOKEN]) as never);
});

afterEach(() => {
  vi.restoreAllMocks();
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
  expect(screen.getByText(ACTIVE_TOKEN_PREFIX)).toBeInTheDocument();
  expect(screen.getByText("2026-08-29 12:00 UTC")).toBeInTheDocument();
  expect(screen.getByText("Never used")).toBeInTheDocument();
  expect(screen.getByText("2026-05-31 12:00 UTC")).toBeInTheDocument();
  expect(screen.getByText("Active token")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Old automation" })).toBeInTheDocument();
  expect(screen.getByText("Revoked token")).toBeInTheDocument();
});

test("API token route hides rotation controls for expired tokens", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [],
    tokens: [EXPIRED_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  expect(screen.getByRole("heading", { name: "Expired token" })).toBeInTheDocument();
  expect(screen.getAllByText("Expired token")).toHaveLength(2);
  expect(
    screen.queryByRole("form", { name: "Rotate Expired token API token" })
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Rotate token" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Revoke token" })).toBeInTheDocument();
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
  expect(oneTimeRegion).toHaveTextContent(ONE_TIME_TOKEN_VALUE);
});

test.each(["30 days", "90 days", "1 year", "No expiration"] as const)(
  "create token applies the %s preset",
  async (preset) => {
    mockedUseLoaderData.mockReturnValue({
      status: "empty",
      tokenQueries: [],
      tokens: [],
      tokenStatus: "all"
    } satisfies ApiTokensRouteLoaderData);

    renderApiTokensRoute();

    const createForm = screen.getByRole("form", { name: "Create API token" });
    const expectedExpiresAtInput = buildApiTokenExpiresAtInputValue(preset, new Date(ROUTE_NOW));

    fireEvent.click(within(createForm).getByRole("button", { name: preset }));
    expect(
      within(createForm).getByLabelText("Expires at")
    ).toHaveValue(expectedExpiresAtInput);
    fireEvent.click(within(createForm).getByRole("button", { name: "Create API token" }));

    await waitFor(() => {
      expect(commitCreateMutationMock).toHaveBeenCalled();
    });

    if (preset === "No expiration") {
      expect(commitCreateMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            label: null,
            expiresAt: null
          }
        })
      );
    } else {
      expect(commitCreateMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            label: null,
            expiresAt: new Date(expectedExpiresAtInput).toISOString()
          }
        })
      );
    }
  }
);

test("create token uses manual expiry after selecting an expiry preset", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  const createForm = screen.getByRole("form", { name: "Create API token" });
  const expiresAtInput = within(createForm).getByLabelText("Expires at");

  fireEvent.click(within(createForm).getByRole("button", { name: "30 days" }));
  expect(expiresAtInput).toHaveValue(
    buildApiTokenExpiresAtInputValue("30 days", new Date(ROUTE_NOW))
  );

  fireEvent.change(expiresAtInput, {
    target: { value: "2026-07-15T09:45" }
  });
  fireEvent.click(within(createForm).getByRole("button", { name: "Create API token" }));

  await waitFor(() => {
    expect(commitCreateMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          label: null,
          expiresAt: new Date("2026-07-15T09:45").toISOString()
        }
      })
    );
  });
});

test("create token ignores duplicate submits while the request is in flight", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  const createForm = screen.getByRole("form", { name: "Create API token" });

  act(() => {
    fireEvent.submit(createForm);
    fireEvent.submit(createForm);
  });

  await waitFor(() => {
    expect(commitCreateMutationMock).toHaveBeenCalledTimes(1);
  });
});

test("create token preserves the default expiry when the expiry field is blank", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  fireEvent.click(screen.getByRole("button", { name: "Create API token" }));

  await waitFor(() => {
    expect(commitCreateMutationMock).toHaveBeenCalledTimes(1);
  });

  const variables = commitCreateMutationMock.mock.calls[0]?.[0]?.variables;
  expect(variables).toEqual({
    label: null
  });
  expect(variables).not.toHaveProperty("expiresAt");
});

test("create token sends null for invalid expiry input", async () => {
  const formDataSpy = stubFormDataExpiry("invalid-date");

  try {
    mockedUseLoaderData.mockReturnValue({
      status: "empty",
      tokenQueries: [],
      tokens: [],
      tokenStatus: "all"
    } satisfies ApiTokensRouteLoaderData);

    renderApiTokensRoute();

    fireEvent.click(screen.getByRole("button", { name: "Create API token" }));

    await waitFor(() => {
      expect(commitCreateMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            expiresAt: null
          })
        })
      );
    });
  } finally {
    formDataSpy.mockRestore();
  }
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

  expect(await screen.findByText(ONE_TIME_TOKEN_VALUE)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "Second token" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create API token" }));

  await waitFor(() => {
    expect(commitCreateMutationMock).toHaveBeenCalledTimes(2);
  });
  expect(screen.queryByText(ONE_TIME_TOKEN_VALUE)).not.toBeInTheDocument();
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
  const rotateButtons = screen.getAllByRole("button", { name: "Rotate token" });
  const rotateForms = screen.getAllByRole("form", { name: /Rotate .* API token/ });

  fireEvent.click(revokeButtons[0]);

  await waitFor(() => {
    expect(commitRevokeMutationMock).toHaveBeenCalledTimes(1);
  });
  expect(revokeButtons[0]).toBeDisabled();
  expect(revokeButtons[1]).not.toBeDisabled();
  expect(rotateButtons[0]).toBeDisabled();
  expect(rotateButtons[1]).not.toBeDisabled();

  fireEvent.submit(rotateForms[0]);

  expect(commitRotateMutationMock).not.toHaveBeenCalled();

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

test("revoke token clears the one-time token when revoke starts", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    tokenQueries: [],
    tokens: [],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  fireEvent.click(screen.getByRole("button", { name: "Create API token" }));

  await waitFor(() => {
    expect(commitCreateMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestCreateMutation(buildSuccessfulCreateResponse());

  expect(await screen.findByText(ONE_TIME_TOKEN_VALUE)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Revoke token" }));

  await waitFor(() => {
    expect(commitRevokeMutationMock).toHaveBeenCalledTimes(1);
  });
  expect(screen.queryByText(ONE_TIME_TOKEN_VALUE)).not.toBeInTheDocument();
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

test("revoke token keeps concurrent row errors scoped to each token", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [],
    tokens: [ACTIVE_TOKEN, BUILD_BOT_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  const revokeButtons = screen.getAllByRole("button", { name: "Revoke token" });
  fireEvent.click(revokeButtons[0]);
  fireEvent.click(revokeButtons[1]);

  await waitFor(() => {
    expect(commitRevokeMutationMock).toHaveBeenCalledTimes(2);
  });

  completeRevokeMutationAt(0, {
    revokeApiToken: {
      apiToken: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "tokenId",
          message: "CLI cannot be revoked."
        }
      ]
    }
  });
  completeRevokeMutationAt(1, {
    revokeApiToken: {
      apiToken: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "tokenId",
          message: "Build bot cannot be revoked."
        }
      ]
    }
  });

  expect(await screen.findByText("CLI cannot be revoked.")).toBeInTheDocument();
  expect(screen.getByText("Build bot cannot be revoked.")).toBeInTheDocument();
  expect(screen.getAllByRole("alert")).toHaveLength(2);
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

test("rotate token commits the selected token id and displays the replacement one-time token", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [API_TOKENS_QUERY_DESCRIPTOR],
    tokens: [ACTIVE_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);
  mockedUsePreloadedQuery.mockReturnValue(buildApiTokenQueryData([ACTIVE_TOKEN]) as never);

  renderApiTokensRoute();

  fireEvent.change(screen.getByLabelText("Replacement label for CLI"), {
    target: { value: "CLI replacement" }
  });
  fireEvent.change(screen.getByLabelText("Replacement expiry for CLI"), {
    target: { value: "2026-09-01T12:00" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Rotate token" }));

  await waitFor(() => {
    expect(commitRotateMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          tokenId: ACTIVE_TOKEN.id,
          label: "CLI replacement",
          expiresAt: new Date("2026-09-01T12:00").toISOString()
        }
      })
    );
  });

  completeLatestRotateMutation(buildSuccessfulRotateResponse());

  const oneTimeRegion = await screen.findByRole("region", { name: "One-time API token" });
  expect(oneTimeRegion).toHaveTextContent(ROTATED_TOKEN_VALUE);
  expect(screen.getByRole("heading", { name: "CLI replacement" })).toBeInTheDocument();
  expect(screen.getByText("Revoked token")).toBeInTheDocument();
});

test.each(["30 days", "90 days", "1 year", "No expiration"] as const)(
  "rotate token applies the %s preset",
  async (preset) => {
    mockedUseLoaderData.mockReturnValue({
      status: "ready",
      tokenQueries: [],
      tokens: [ACTIVE_TOKEN],
      tokenStatus: "all"
    } satisfies ApiTokensRouteLoaderData);

    renderApiTokensRoute();

    const rotateForm = screen.getByRole("form", { name: "Rotate CLI API token" });
    const expectedExpiresAtInput = buildApiTokenExpiresAtInputValue(preset, new Date(ROUTE_NOW));

    fireEvent.click(within(rotateForm).getByRole("button", { name: preset }));
    expect(within(rotateForm).getByLabelText("Replacement expiry for CLI")).toHaveValue(
      expectedExpiresAtInput
    );
    fireEvent.submit(rotateForm);

    await waitFor(() => {
      expect(commitRotateMutationMock).toHaveBeenCalled();
    });

    const rotationVariables = commitRotateMutationMock.mock.calls.at(-1)?.[0]?.variables;
    expect(rotationVariables).toMatchObject({
      tokenId: ACTIVE_TOKEN.id,
      label: "CLI"
    });

    if (preset === "No expiration") {
      expect(rotationVariables).toMatchObject({
        expiresAt: null
      });
    } else {
      expect(rotationVariables).toMatchObject({
        expiresAt: new Date(expectedExpiresAtInput).toISOString()
      });
    }
  }
);

test("rotate token uses the selected row label when no replacement label is entered", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [],
    tokens: [ACTIVE_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  fireEvent.click(screen.getByRole("button", { name: "Rotate token" }));

  await waitFor(() => {
    expect(commitRotateMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          tokenId: ACTIVE_TOKEN.id,
          label: "CLI"
        }
      })
    );
  });

  const variables = commitRotateMutationMock.mock.calls[0]?.[0]?.variables;
  expect(variables).not.toHaveProperty("expiresAt");
});

test("rotate token sends null for invalid replacement expiry input", async () => {
  const formDataSpy = stubFormDataExpiry("not-a-real-date");

  try {
    mockedUseLoaderData.mockReturnValue({
      status: "ready",
      tokenQueries: [],
      tokens: [ACTIVE_TOKEN],
      tokenStatus: "all"
    } satisfies ApiTokensRouteLoaderData);

    renderApiTokensRoute();

    fireEvent.click(screen.getByRole("button", { name: "Rotate token" }));

    await waitFor(() => {
      expect(commitRotateMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            expiresAt: null
          })
        })
      );
    });
  } finally {
    formDataSpy.mockRestore();
  }
});

test("rotate token disables only the pending row", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [],
    tokens: [ACTIVE_TOKEN, BUILD_BOT_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  const rotateButtons = screen.getAllByRole("button", { name: "Rotate token" });
  const revokeButtons = screen.getAllByRole("button", { name: "Revoke token" });

  fireEvent.click(rotateButtons[0]);

  await waitFor(() => {
    expect(commitRotateMutationMock).toHaveBeenCalledTimes(1);
  });
  expect(rotateButtons[0]).toBeDisabled();
  expect(rotateButtons[1]).not.toBeDisabled();
  expect(revokeButtons[0]).toBeDisabled();
  expect(revokeButtons[1]).not.toBeDisabled();

  fireEvent.click(revokeButtons[0]);

  expect(commitRevokeMutationMock).not.toHaveBeenCalled();

  fireEvent.click(rotateButtons[1]);

  await waitFor(() => {
    expect(commitRotateMutationMock).toHaveBeenCalledTimes(2);
  });
  expect(commitRotateMutationMock).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      variables: {
        tokenId: BUILD_BOT_TOKEN.id,
        label: "Build bot"
      }
    })
  );
});

test("rotate token renders mutation payload errors", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [],
    tokens: [ACTIVE_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  fireEvent.click(screen.getByRole("button", { name: "Rotate token" }));

  await waitFor(() => {
    expect(commitRotateMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestRotateMutation({
    rotateApiToken: {
      plainTextToken: null,
      apiToken: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "tokenId",
          message: "Token cannot be rotated."
        }
      ]
    }
  });

  expect(await screen.findByRole("alert")).toHaveTextContent("Token cannot be rotated.");
  expect(screen.queryByRole("region", { name: "One-time API token" })).not.toBeInTheDocument();
  expect(screen.getByText("Active token")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Rotate token" })).not.toBeDisabled();
});

test("rotate token keeps concurrent row errors scoped to each token", async () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    tokenQueries: [],
    tokens: [ACTIVE_TOKEN, BUILD_BOT_TOKEN],
    tokenStatus: "all"
  } satisfies ApiTokensRouteLoaderData);

  renderApiTokensRoute();

  const rotateButtons = screen.getAllByRole("button", { name: "Rotate token" });
  fireEvent.click(rotateButtons[0]);
  fireEvent.click(rotateButtons[1]);

  await waitFor(() => {
    expect(commitRotateMutationMock).toHaveBeenCalledTimes(2);
  });

  completeRotateMutationAt(0, {
    rotateApiToken: {
      plainTextToken: null,
      apiToken: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "tokenId",
          message: "CLI cannot be rotated."
        }
      ]
    }
  });
  completeRotateMutationAt(1, {
    rotateApiToken: {
      plainTextToken: null,
      apiToken: null,
      errors: [
        {
          code: "INVALID_ARGUMENT",
          field: "tokenId",
          message: "Build bot cannot be rotated."
        }
      ]
    }
  });

  expect(await screen.findByText("CLI cannot be rotated.")).toBeInTheDocument();
  expect(screen.getByText("Build bot cannot be rotated.")).toBeInTheDocument();
  expect(screen.getAllByRole("alert")).toHaveLength(2);
});

test("server token snapshots supersede local mutation snapshots after reload", async () => {
  let loaderData: ApiTokensRouteLoaderData = {
    status: "ready",
    tokenQueries: [API_TOKENS_QUERY_DESCRIPTOR],
    tokens: [ACTIVE_TOKEN],
    tokenStatus: "all"
  };
  const serverRotatedToken: ApiTokenSummary = {
    id: "QXBpVG9rZW46cm90YXRlZC10b2tlbg==",
    label: "Server replacement",
    tokenPrefix: ROTATED_TOKEN_PREFIX,
    lastUsedAt: "2026-06-01T13:00:00Z",
    expiresAt: "2026-09-02T12:00:00Z",
    revokedAt: null,
    insertedAt: "2026-06-01T12:00:00Z"
  };

  mockedUseLoaderData.mockImplementation(() => loaderData);
  mockedUsePreloadedQuery.mockReturnValue(buildApiTokenQueryData([ACTIVE_TOKEN]) as never);

  const { rerender } = renderApiTokensRoute();

  fireEvent.change(screen.getByLabelText("Replacement label for CLI"), {
    target: { value: "Local replacement" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Rotate token" }));

  await waitFor(() => {
    expect(commitRotateMutationMock).toHaveBeenCalledTimes(1);
  });
  completeLatestRotateMutation(buildSuccessfulRotateResponse());

  expect(await screen.findByRole("heading", { name: "CLI replacement" })).toBeInTheDocument();

  loaderData = {
    status: "ready",
    tokenQueries: [API_TOKENS_QUERY_DESCRIPTOR],
    tokens: [serverRotatedToken],
    tokenStatus: "all"
  };
  mockedUsePreloadedQuery.mockReturnValue(buildApiTokenQueryData([serverRotatedToken]) as never);

  rerender(
    <MemoryRouter>
      <ApiTokensRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Server replacement" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "CLI replacement" })).not.toBeInTheDocument();
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

function completeRevokeMutationAt(index: number, response: unknown, graphQLErrors?: unknown[]) {
  act(() => {
    commitRevokeMutationMock.mock.calls[index]?.[0]?.onCompleted(response, graphQLErrors);
  });
}

function completeLatestRotateMutation(response: unknown, graphQLErrors?: unknown[]) {
  act(() => {
    commitRotateMutationMock.mock.calls.at(-1)?.[0]?.onCompleted(response, graphQLErrors);
  });
}

function completeRotateMutationAt(index: number, response: unknown, graphQLErrors?: unknown[]) {
  act(() => {
    commitRotateMutationMock.mock.calls[index]?.[0]?.onCompleted(response, graphQLErrors);
  });
}

function stubFormDataExpiry(expiresAt: string) {
  const RealFormData = globalThis.FormData;
  const FormDataWithExpiry = function (
    form?: HTMLFormElement,
    submitter?: HTMLElement | null
  ) {
    const formData = new RealFormData(form, submitter);
    formData.set("expiresAt", expiresAt);
    return formData;
  } as unknown as typeof FormData;

  return vi
    .spyOn(globalThis, "FormData")
    .mockImplementation(FormDataWithExpiry);
}

function buildSuccessfulCreateResponse() {
  return {
    createApiToken: {
      plainTextToken: ONE_TIME_TOKEN_VALUE,
      apiToken: {
        id: "QXBpVG9rZW46Y3JlYXRlZC10b2tlbg==",
        label: "CLI automation",
        tokenPrefix: CREATED_TOKEN_PREFIX,
        lastUsedAt: null,
        expiresAt: "2026-08-29T12:00:00Z",
        revokedAt: null,
        insertedAt: "2026-05-31T14:00:00Z"
      },
      errors: []
    }
  };
}

function buildSuccessfulRotateResponse() {
  return {
    rotateApiToken: {
      plainTextToken: ROTATED_TOKEN_VALUE,
      apiToken: {
        id: "QXBpVG9rZW46cm90YXRlZC10b2tlbg==",
        label: "CLI replacement",
        tokenPrefix: ROTATED_TOKEN_PREFIX,
        lastUsedAt: null,
        expiresAt: "2026-09-01T12:00:00Z",
        revokedAt: null,
        insertedAt: "2026-06-01T12:00:00Z"
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
