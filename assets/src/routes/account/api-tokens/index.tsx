import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import apiTokensRouteQuery, {
  type ApiTokensRouteQuery
} from "../../../__generated__/ApiTokensRouteQuery.graphql";
import { stableJsonValue, useRoutePreloadedQuery } from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/resettable-error-boundary";
import type { ApiTokenQueryDescriptor, ApiTokenSummary, ApiTokensRouteLoaderData } from "./loader";
import { apiTokensLoader, summarizeApiTokensPage } from "./loader";

const STATUS_FILTERS = [
  { label: "All", status: "all" },
  { label: "Active", status: "active" },
  { label: "Revoked", status: "revoked" }
] as const;

export function ApiTokensRoute() {
  const loaderData = useLoaderData<typeof apiTokensLoader>();
  const tokenQueries = loaderData.status === "unauthorized" ? [] : loaderData.tokenQueries;
  const viewState = buildApiTokensViewState(loaderData);

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

          {viewState.tokens.length > 0 && tokenQueries.length > 0 ? (
            <ResettableErrorBoundary
              fallback={<ApiTokenList tokens={viewState.tokens} />}
              resetToken={tokenQueries}
            >
              <Suspense fallback={<p role="status">Loading API tokens...</p>}>
                <RelayApiTokenList tokenQueries={tokenQueries} />
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
  tokenQueries
}: {
  tokenQueries: ApiTokenQueryDescriptor[];
}) {
  return (
    <ul aria-label="API tokens">
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

function buildApiTokensViewState(loaderData: ApiTokensRouteLoaderData) {
  if (loaderData.status === "unauthorized") {
    return {
      statusMessage: "Sign in to manage API tokens.",
      tokens: []
    };
  }

  if (loaderData.tokens.length === 0) {
    return {
      statusMessage: "No API tokens yet.",
      tokens: []
    };
  }

  return {
    statusMessage: "",
    tokens: loaderData.tokens
  };
}
