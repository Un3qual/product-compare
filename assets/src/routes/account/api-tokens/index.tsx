import { Suspense, type FormEvent, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import createApiTokenMutation, {
  type CreateApiTokenMutation
} from "../../../__generated__/CreateApiTokenMutation.graphql";
import apiTokensRouteQuery, {
  type ApiTokensRouteQuery
} from "../../../__generated__/ApiTokensRouteQuery.graphql";
import { stableJsonValue, useRoutePreloadedQuery } from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/resettable-error-boundary";
import { commitRouteMutationPromise } from "../../relay-mutations";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../../route-errors";
import type { ApiTokenQueryDescriptor, ApiTokenSummary, ApiTokensRouteLoaderData } from "./loader";
import { apiTokensLoader, summarizeApiTokensPage } from "./loader";

const STATUS_FILTERS = [
  { label: "All", status: "all" },
  { label: "Active", status: "active" },
  { label: "Revoked", status: "revoked" }
] as const;

export function ApiTokensRoute() {
  const loaderData = useLoaderData<typeof apiTokensLoader>();
  const [createdTokens, setCreatedTokens] = useState<ApiTokenSummary[]>([]);
  const [oneTimeToken, setOneTimeToken] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);
  const [commitCreateApiToken, createMutationPending] = useMutation<CreateApiTokenMutation>(
    createApiTokenMutation
  );
  const tokenQueries = loaderData.status === "unauthorized" ? [] : loaderData.tokenQueries;
  const viewState = buildApiTokensViewState(loaderData, createdTokens);
  const createSubmitting = createPending || createMutationPending;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (createSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const variables = buildCreateApiTokenVariables(new FormData(form));

    setCreatePending(true);
    setCreateError(null);
    setOneTimeToken(null);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(
        commitCreateApiToken,
        {
          variables
        }
      );
      const payload = response.createApiToken;
      const createdToken = summarizeMutationApiToken(payload?.apiToken);

      if (
        payload?.plainTextToken &&
        createdToken &&
        !hasRouteGraphQLErrors(graphQLErrors)
      ) {
        setCreateError(null);
        setCreatedTokens((currentTokens) => upsertApiTokenSummary(currentTokens, createdToken));
        setOneTimeToken(payload.plainTextToken);
        form.reset();
      } else {
        setCreateError(routeMutationErrorMessage(payload?.errors, graphQLErrors));
      }
    } catch {
      setCreateError(DEFAULT_ROUTE_ERROR_MESSAGE);
    } finally {
      setCreatePending(false);
    }
  }

  return (
    <section>
      <header>
        <h1>API tokens</h1>
        <p>Manage API credentials for command-line tools and automation.</p>
      </header>

      <p aria-live="polite" role="status">
        {viewState.statusMessage}
      </p>

      {loaderData.status === "unauthorized" ? (
        <p>
          <Link to="/auth/login">Sign in to manage API tokens</Link>
        </p>
      ) : (
        <>
          <nav aria-label="API token status filters">
            <ul>
              {STATUS_FILTERS.map((filter) => (
                <li key={filter.status}>
                  <Link
                    aria-current={loaderData.tokenStatus === filter.status ? "page" : undefined}
                    to={`/account/api-tokens?status=${filter.status}`}
                  >
                    {filter.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <form aria-label="Create API token" onSubmit={handleCreate}>
            <h2>Create API token</h2>
            <label>
              Label
              <input autoComplete="off" name="label" type="text" />
            </label>
            <label>
              Expires at
              <input name="expiresAt" type="datetime-local" />
            </label>
            <button disabled={createSubmitting} type="submit">
              {createSubmitting ? "Creating API token..." : "Create API token"}
            </button>
          </form>

          {createError ? <p role="alert">{createError}</p> : null}

          {oneTimeToken ? (
            <section aria-labelledby="api-token-one-time-heading">
              <h2 id="api-token-one-time-heading">One-time API token</h2>
              <p>Visible only once. Copy this token now before leaving the page.</p>
              <code>{oneTimeToken}</code>
            </section>
          ) : null}

          {viewState.tokens.length > 0 && tokenQueries.length > 0 ? (
            <ResettableErrorBoundary
              fallback={<ApiTokenList tokens={viewState.tokens} />}
              resetToken={tokenQueries}
            >
              <Suspense fallback={<p role="status">Loading API tokens...</p>}>
                <RelayApiTokenList
                  localTokens={viewState.localTokens}
                  tokenQueries={tokenQueries}
                />
              </Suspense>
            </ResettableErrorBoundary>
          ) : null}

          {viewState.tokens.length > 0 && tokenQueries.length === 0 ? (
            <ApiTokenList tokens={viewState.tokens} />
          ) : null}
        </>
      )}
    </section>
  );
}

function RelayApiTokenList({
  localTokens,
  tokenQueries
}: {
  localTokens: ApiTokenSummary[];
  tokenQueries: ApiTokenQueryDescriptor[];
}) {
  return (
    <ul aria-label="API tokens">
      {localTokens.map((token) => (
        <ApiTokenListItem key={token.id} token={token} />
      ))}
      {tokenQueries.map((tokenQuery) => (
        <RelayApiTokenPage key={apiTokenQueryKey(tokenQuery)} tokenQuery={tokenQuery} />
      ))}
    </ul>
  );
}

function RelayApiTokenPage({ tokenQuery }: { tokenQuery: ApiTokenQueryDescriptor }) {
  const queryRef = useRoutePreloadedQuery<ApiTokensRouteQuery>(
    apiTokensRouteQuery,
    tokenQuery
  );
  const data = usePreloadedQuery<ApiTokensRouteQuery>(apiTokensRouteQuery, queryRef);
  const page = summarizeApiTokensPage(data);

  return (
    <>
      {page.tokens.map((token) => (
        <ApiTokenListItem key={token.id} token={token} />
      ))}
    </>
  );
}

function ApiTokenList({ tokens }: { tokens: ApiTokenSummary[] }) {
  return (
    <ul aria-label="API tokens">
      {tokens.map((token) => (
        <ApiTokenListItem key={token.id} token={token} />
      ))}
    </ul>
  );
}

function ApiTokenListItem({ token }: { token: ApiTokenSummary }) {
  return (
    <li>
      <article>
        <h2>{token.label ?? "Unlabeled token"}</h2>
        <dl>
          <div>
            <dt>Token prefix</dt>
            <dd>{token.tokenPrefix}</dd>
          </div>
          <div>
            <dt>Expires</dt>
            <dd>{formatOptionalDateTime(token.expiresAt, "Never expires")}</dd>
          </div>
          <div>
            <dt>Last used</dt>
            <dd>{formatOptionalDateTime(token.lastUsedAt, "Never used")}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatUtcDateTime(token.insertedAt)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{token.revokedAt ? "Revoked token" : "Active token"}</dd>
          </div>
        </dl>
      </article>
    </li>
  );
}

export function apiTokenQueryKey(tokenQuery: ApiTokenQueryDescriptor) {
  return `${tokenQuery.__relayQuery.operationName}:${JSON.stringify(
    stableJsonValue(tokenQuery.__relayQuery.variables)
  )}`;
}

function formatOptionalDateTime(value: string | null, emptyLabel: string) {
  return value ? formatUtcDateTime(value) : emptyLabel;
}

function formatUtcDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getUTCFullYear()}-${padUtcPart(date.getUTCMonth() + 1)}-${padUtcPart(
    date.getUTCDate()
  )} ${padUtcPart(date.getUTCHours())}:${padUtcPart(date.getUTCMinutes())} UTC`;
}

function padUtcPart(value: number) {
  return value.toString().padStart(2, "0");
}

function buildApiTokensViewState(
  loaderData: ApiTokensRouteLoaderData,
  createdTokens: ApiTokenSummary[] = []
) {
  const localTokens =
    loaderData.status === "unauthorized"
      ? []
      : createdTokens.filter((token) => apiTokenMatchesStatus(token, loaderData.tokenStatus));

  if (loaderData.status === "unauthorized") {
    return {
      localTokens,
      statusMessage: "Sign in to manage API tokens.",
      tokens: []
    };
  }

  const tokens = mergeApiTokenSummaries(localTokens, loaderData.tokens);

  if (tokens.length === 0) {
    return {
      localTokens,
      statusMessage: "No API tokens yet.",
      tokens: []
    };
  }

  return {
    localTokens,
    statusMessage: localTokens.length > 0 ? "API token created." : "",
    tokens
  };
}

function buildCreateApiTokenVariables(formData: FormData): CreateApiTokenMutation["variables"] {
  const expiresAt = normalizeDateTimeLocalValue(optionalFormText(formData.get("expiresAt")));

  return {
    label: optionalFormText(formData.get("label")),
    expiresAt
  };
}

function optionalFormText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeDateTimeLocalValue(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

type MutationApiToken = NonNullable<
  NonNullable<CreateApiTokenMutation["response"]["createApiToken"]>["apiToken"]
>;

function summarizeMutationApiToken(token: MutationApiToken | null | undefined) {
  if (!token) {
    return null;
  }

  return {
    id: token.id,
    label: token.label ?? null,
    tokenPrefix: token.tokenPrefix,
    lastUsedAt: token.lastUsedAt ?? null,
    expiresAt: token.expiresAt ?? null,
    revokedAt: token.revokedAt ?? null,
    insertedAt: token.insertedAt
  } satisfies ApiTokenSummary;
}

function apiTokenMatchesStatus(
  token: ApiTokenSummary,
  status: ApiTokensRouteLoaderData["tokenStatus"]
) {
  if (status === "all") {
    return true;
  }

  if (status === "active") {
    return token.revokedAt === null;
  }

  return token.revokedAt !== null;
}

function mergeApiTokenSummaries(
  localTokens: ApiTokenSummary[],
  loaderTokens: ApiTokenSummary[]
) {
  if (localTokens.length === 0) {
    return loaderTokens;
  }

  const localTokenIds = new Set(localTokens.map((token) => token.id));
  return [...localTokens, ...loaderTokens.filter((token) => !localTokenIds.has(token.id))];
}

function upsertApiTokenSummary(tokens: ApiTokenSummary[], nextToken: ApiTokenSummary) {
  return [nextToken, ...tokens.filter((token) => token.id !== nextToken.id)];
}
