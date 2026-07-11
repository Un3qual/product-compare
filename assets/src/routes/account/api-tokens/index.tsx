import { Suspense, type FormEvent, useMemo, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import createApiTokenMutation, {
  type CreateApiTokenMutation
} from "../../../__generated__/CreateApiTokenMutation.graphql";
import revokeApiTokenMutation, {
  type RevokeApiTokenMutation
} from "../../../__generated__/RevokeApiTokenMutation.graphql";
import rotateApiTokenMutation, {
  type RotateApiTokenMutation
} from "../../../__generated__/RotateApiTokenMutation.graphql";
import apiTokensRouteQuery, {
  type ApiTokensRouteQuery
} from "../../../__generated__/ApiTokensRouteQuery.graphql";
import { stableJsonValue, useRoutePreloadedQuery } from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/resettable-error-boundary";
import { PageShell } from "../../../ui/components/layout/page-shell";
import { Pagination } from "../../../ui/components/navigation/pagination";
import { StatusBadge } from "../../../ui/components/status/status-badge";
import { Button } from "../../../ui/primitives/button";
import { TextField } from "../../../ui/primitives/text-field";
import { tokens } from "../../../ui/theme/tokens.stylex";
import { commitRouteMutation, commitRouteMutationPromise } from "../../relay-mutations";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../../route-errors";
import {
  API_TOKEN_EXPIRES_AT_PRESETS,
  buildApiTokenExpiresAtInputValue
} from "./date-presets";
import type { ApiTokenQueryDescriptor, ApiTokenSummary, ApiTokensRouteLoaderData } from "./loader";
import { apiTokensLoader, summarizeApiTokensPage } from "./loader";

const STATUS_FILTERS = [
  { label: "All", status: "all" },
  { label: "Active", status: "active" },
  { label: "Revoked", status: "revoked" }
] as const;

const styles = stylex.create({
  createForm: {
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--radius-4)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
    padding: "1.15rem"
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  item: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    paddingBlock: "1.25rem"
  },
  token: {
    display: "grid",
    gap: "0.85rem"
  },
  tokenTitle: {
    fontSize: "1.2rem",
    margin: 0
  },
  rotateForm: {
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--radius-3)",
    display: "grid",
    gap: "0.75rem",
    padding: "0.9rem"
  }
});

export function ApiTokensRoute() {
  const loaderData = useLoaderData<typeof apiTokensLoader>();
  const [createdTokens, setCreatedTokens] = useState<ApiTokenSummary[]>([]);
  const [apiTokenUpdates, setApiTokenUpdates] = useState<ReadonlyMap<string, ApiTokenSummary>>(
    () => new Map()
  );
  const [oneTimeToken, setOneTimeToken] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);
  const createInFlightRef = useRef(false);
  const createExpiresAtInputRef = useRef<HTMLInputElement>(null);
  const createExpiresAtPresetInputRef = useRef<HTMLInputElement>(null);
  const [revokeErrorsByTokenId, setRevokeErrorsByTokenId] = useState<
    ReadonlyMap<string, string>
  >(() => new Map());
  const [pendingRevokeIds, setPendingRevokeIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const inFlightRevokeIdsRef = useRef<Set<string>>(new Set());
  const [rotateErrorsByTokenId, setRotateErrorsByTokenId] = useState<
    ReadonlyMap<string, string>
  >(() => new Map());
  const [pendingRotateIds, setPendingRotateIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const inFlightRotateIdsRef = useRef<Set<string>>(new Set());
  const [commitCreateApiToken, createMutationPending] = useMutation<CreateApiTokenMutation>(
    createApiTokenMutation
  );
  const [commitRevokeApiToken] = useMutation<RevokeApiTokenMutation>(revokeApiTokenMutation);
  const [commitRotateApiToken] = useMutation<RotateApiTokenMutation>(rotateApiTokenMutation);
  const tokenQueries = loaderData.status === "unauthorized" ? [] : loaderData.tokenQueries;
  const viewState = useMemo(
    () => buildApiTokensViewState(loaderData, createdTokens, apiTokenUpdates),
    [apiTokenUpdates, createdTokens, loaderData]
  );
  const createSubmitting = createPending || createMutationPending;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (createInFlightRef.current || createSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const variables = buildCreateApiTokenVariables(new FormData(form));

    createInFlightRef.current = true;
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
      createInFlightRef.current = false;
      setCreatePending(false);
    }
  }

  function finishRevoke(tokenId: string) {
    inFlightRevokeIdsRef.current.delete(tokenId);
    setPendingRevokeIds((currentPendingRevokeIds) =>
      removeSetValue(currentPendingRevokeIds, tokenId)
    );
  }

  function finishRotate(tokenId: string) {
    inFlightRotateIdsRef.current.delete(tokenId);
    setPendingRotateIds((currentPendingRotateIds) =>
      removeSetValue(currentPendingRotateIds, tokenId)
    );
  }

  function handleRotate(token: ApiTokenSummary, form: HTMLFormElement) {
    if (
      inFlightRotateIdsRef.current.has(token.id) ||
      inFlightRevokeIdsRef.current.has(token.id) ||
      !apiTokenIsActive(token)
    ) {
      return;
    }

    const variables = buildRotateApiTokenVariables(token, new FormData(form));

    inFlightRotateIdsRef.current.add(token.id);
    setPendingRotateIds((currentPendingRotateIds) =>
      addSetValue(currentPendingRotateIds, token.id)
    );
    setRotateErrorsByTokenId((currentErrors) => removeMapValue(currentErrors, token.id));
    setOneTimeToken(null);

    commitRouteMutation(
      commitRotateApiToken,
      {
        variables,
        onCompleted: (response, graphQLErrors) => {
          const payload = response.rotateApiToken;
          const rotatedToken = summarizeMutationApiToken(payload?.apiToken);

          if (
            payload?.plainTextToken &&
            rotatedToken &&
            !hasRouteGraphQLErrors(graphQLErrors)
          ) {
            const revokedPreviousToken = markTokenRotated(token, rotatedToken);

            setRotateErrorsByTokenId((currentErrors) => removeMapValue(currentErrors, token.id));
            setCreatedTokens((currentTokens) =>
              upsertApiTokenSummary(currentTokens, rotatedToken)
            );
            setApiTokenUpdates((currentUpdates) =>
              upsertApiTokenSummaryMap(
                upsertApiTokenSummaryMap(currentUpdates, rotatedToken),
                revokedPreviousToken
              )
            );
            setOneTimeToken(payload.plainTextToken);
            form.reset();
          } else {
            setRotateErrorsByTokenId((currentErrors) =>
              upsertMapValue(
                currentErrors,
                token.id,
                routeMutationErrorMessage(payload?.errors, graphQLErrors)
              )
            );
          }

          finishRotate(token.id);
        },
        onError: () => {
          setRotateErrorsByTokenId((currentErrors) =>
            upsertMapValue(currentErrors, token.id, DEFAULT_ROUTE_ERROR_MESSAGE)
          );
          finishRotate(token.id);
        }
      },
      () => {
        setRotateErrorsByTokenId((currentErrors) =>
          upsertMapValue(currentErrors, token.id, DEFAULT_ROUTE_ERROR_MESSAGE)
        );
        finishRotate(token.id);
      }
    );
  }

  function handleRevoke(tokenId: string) {
    if (inFlightRevokeIdsRef.current.has(tokenId) || inFlightRotateIdsRef.current.has(tokenId)) {
      return;
    }

    inFlightRevokeIdsRef.current.add(tokenId);
    setPendingRevokeIds((currentPendingRevokeIds) =>
      addSetValue(currentPendingRevokeIds, tokenId)
    );
    setRevokeErrorsByTokenId((currentErrors) => removeMapValue(currentErrors, tokenId));
    setOneTimeToken(null);

    commitRouteMutation(
      commitRevokeApiToken,
      {
        variables: {
          tokenId
        },
        onCompleted: (response, graphQLErrors) => {
          const payload = response.revokeApiToken;
          const revokedToken = summarizeMutationApiToken(payload?.apiToken);

          if (revokedToken && !hasRouteGraphQLErrors(graphQLErrors)) {
            setRevokeErrorsByTokenId((currentErrors) => removeMapValue(currentErrors, tokenId));
            setApiTokenUpdates((currentUpdates) =>
              upsertApiTokenSummaryMap(currentUpdates, revokedToken)
            );
          } else {
            setRevokeErrorsByTokenId((currentErrors) =>
              upsertMapValue(
                currentErrors,
                tokenId,
                routeMutationErrorMessage(payload?.errors, graphQLErrors)
              )
            );
          }

          finishRevoke(tokenId);
        },
        onError: () => {
          setRevokeErrorsByTokenId((currentErrors) =>
            upsertMapValue(currentErrors, tokenId, DEFAULT_ROUTE_ERROR_MESSAGE)
          );
          finishRevoke(tokenId);
        }
      },
      () => {
        setRevokeErrorsByTokenId((currentErrors) =>
          upsertMapValue(currentErrors, tokenId, DEFAULT_ROUTE_ERROR_MESSAGE)
        );
        finishRevoke(tokenId);
      }
    );
  }

  return (
    <PageShell
      description="Manage API credentials for command-line tools and automation."
      eyebrow="Account security"
      title="API tokens"
    >
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

          <form aria-label="Create API token" onSubmit={handleCreate} {...stylex.props(styles.createForm)}>
            <h2>Create API token</h2>
            <label>
              Label
              <TextField autoComplete="off" name="label" type="text" />
            </label>
            <label>
              Expires at
              <input
                name="expiresAt"
                onChange={() => {
                  if (createExpiresAtPresetInputRef.current) {
                    createExpiresAtPresetInputRef.current.value = "";
                  }
                }}
                ref={createExpiresAtInputRef}
                type="datetime-local"
              />
            </label>
            <input name="expiresAtPreset" ref={createExpiresAtPresetInputRef} type="hidden" />
            <div>
              {API_TOKEN_EXPIRES_AT_PRESETS.map((preset) => (
                <Button
                  size="1"
                  variant="soft"
                  key={preset.label}
                  onClick={() => {
                    if (createExpiresAtInputRef.current) {
                      createExpiresAtInputRef.current.value = buildApiTokenExpiresAtInputValue(
                        preset.label,
                        new Date(Date.now())
                      );
                    }
                    if (createExpiresAtPresetInputRef.current) {
                      createExpiresAtPresetInputRef.current.value = preset.label;
                    }
                  }}
                  type="button"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Button disabled={createSubmitting} type="submit">
              {createSubmitting ? "Creating API token..." : "Create API token"}
            </Button>
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
              fallback={
                <ApiTokenList
                  onRotate={handleRotate}
                  onRevoke={handleRevoke}
                  pendingRevokeIds={pendingRevokeIds}
                  pendingRotateIds={pendingRotateIds}
                  revokeErrorsByTokenId={revokeErrorsByTokenId}
                  rotateErrorsByTokenId={rotateErrorsByTokenId}
                  tokens={viewState.tokens}
                />
              }
              resetToken={tokenQueries}
            >
              <Suspense fallback={<p role="status">Loading API tokens...</p>}>
                <RelayApiTokenList
                  apiTokenUpdates={apiTokenUpdates}
                  localTokens={viewState.localTokens}
                  onRotate={handleRotate}
                  onRevoke={handleRevoke}
                  pendingRevokeIds={pendingRevokeIds}
                  pendingRotateIds={pendingRotateIds}
                  revokeErrorsByTokenId={revokeErrorsByTokenId}
                  rotateErrorsByTokenId={rotateErrorsByTokenId}
                  tokenStatus={loaderData.tokenStatus}
                  tokenQueries={tokenQueries}
                />
              </Suspense>
            </ResettableErrorBoundary>
          ) : null}

          {viewState.tokens.length > 0 && tokenQueries.length === 0 ? (
            <ApiTokenList
              onRotate={handleRotate}
              onRevoke={handleRevoke}
              pendingRevokeIds={pendingRevokeIds}
              pendingRotateIds={pendingRotateIds}
              revokeErrorsByTokenId={revokeErrorsByTokenId}
              rotateErrorsByTokenId={rotateErrorsByTokenId}
              tokens={viewState.tokens}
            />
          ) : null}
          <ApiTokenPagination
            after={loaderData.after ?? null}
            endCursor={loaderData.endCursor ?? null}
            hasNextPage={loaderData.hasNextPage ?? false}
            tokenStatus={loaderData.tokenStatus}
          />
        </>
      )}
    </PageShell>
  );
}

function ApiTokenPagination({
  after,
  endCursor,
  hasNextPage,
  tokenStatus
}: {
  after: string | null;
  endCursor: string | null;
  hasNextPage: boolean;
  tokenStatus: ApiTokensRouteLoaderData["tokenStatus"];
}) {
  return (
    <Pagination
      firstHref={after ? apiTokenPagePath(tokenStatus, null) : null}
      label="API token pages"
      nextHref={hasNextPage && endCursor ? apiTokenPagePath(tokenStatus, endCursor) : null}
    />
  );
}

function apiTokenPagePath(
  tokenStatus: ApiTokensRouteLoaderData["tokenStatus"],
  after: string | null
) {
  const searchParams = new URLSearchParams({ status: tokenStatus });

  if (after) {
    searchParams.set("after", after);
  }

  return `/account/api-tokens?${searchParams.toString()}`;
}

function RelayApiTokenList({
  apiTokenUpdates,
  localTokens,
  onRotate,
  onRevoke,
  pendingRevokeIds,
  pendingRotateIds,
  revokeErrorsByTokenId,
  rotateErrorsByTokenId,
  tokenStatus,
  tokenQueries
}: {
  apiTokenUpdates: ReadonlyMap<string, ApiTokenSummary>;
  localTokens: ApiTokenSummary[];
  onRotate: (token: ApiTokenSummary, form: HTMLFormElement) => void;
  onRevoke: (tokenId: string) => void;
  pendingRevokeIds: ReadonlySet<string>;
  pendingRotateIds: ReadonlySet<string>;
  revokeErrorsByTokenId: ReadonlyMap<string, string>;
  rotateErrorsByTokenId: ReadonlyMap<string, string>;
  tokenStatus: ApiTokensRouteLoaderData["tokenStatus"];
  tokenQueries: ApiTokenQueryDescriptor[];
}) {
  return (
    <ul aria-label="API tokens" {...stylex.props(styles.list)}>
      {localTokens.map((token) => (
        <ApiTokenListItem
          key={token.id}
          onRotate={onRotate}
          onRevoke={onRevoke}
          pendingRevokeIds={pendingRevokeIds}
          pendingRotateIds={pendingRotateIds}
          revokeError={revokeErrorsByTokenId.get(token.id) ?? null}
          rotateError={rotateErrorsByTokenId.get(token.id) ?? null}
          token={token}
        />
      ))}
      {tokenQueries.map((tokenQuery) => (
        <RelayApiTokenPage
          apiTokenUpdates={apiTokenUpdates}
          key={apiTokenQueryKey(tokenQuery)}
          onRotate={onRotate}
          onRevoke={onRevoke}
          pendingRevokeIds={pendingRevokeIds}
          pendingRotateIds={pendingRotateIds}
          revokeErrorsByTokenId={revokeErrorsByTokenId}
          rotateErrorsByTokenId={rotateErrorsByTokenId}
          tokenQuery={tokenQuery}
          tokenStatus={tokenStatus}
        />
      ))}
    </ul>
  );
}

function RelayApiTokenPage({
  apiTokenUpdates,
  onRotate,
  onRevoke,
  pendingRevokeIds,
  pendingRotateIds,
  revokeErrorsByTokenId,
  rotateErrorsByTokenId,
  tokenQuery,
  tokenStatus
}: {
  apiTokenUpdates: ReadonlyMap<string, ApiTokenSummary>;
  onRotate: (token: ApiTokenSummary, form: HTMLFormElement) => void;
  onRevoke: (tokenId: string) => void;
  pendingRevokeIds: ReadonlySet<string>;
  pendingRotateIds: ReadonlySet<string>;
  revokeErrorsByTokenId: ReadonlyMap<string, string>;
  rotateErrorsByTokenId: ReadonlyMap<string, string>;
  tokenQuery: ApiTokenQueryDescriptor;
  tokenStatus: ApiTokensRouteLoaderData["tokenStatus"];
}) {
  const queryRef = useRoutePreloadedQuery<ApiTokensRouteQuery>(
    apiTokensRouteQuery,
    tokenQuery
  );
  const data = usePreloadedQuery<ApiTokensRouteQuery>(apiTokensRouteQuery, queryRef);
  const page = summarizeApiTokensPage(data);
  const tokens = applyApiTokenUpdates(page.tokens, apiTokenUpdates, tokenStatus);

  return (
    <>
      {tokens.map((token) => (
        <ApiTokenListItem
          key={token.id}
          onRotate={onRotate}
          onRevoke={onRevoke}
          pendingRevokeIds={pendingRevokeIds}
          pendingRotateIds={pendingRotateIds}
          revokeError={revokeErrorsByTokenId.get(token.id) ?? null}
          rotateError={rotateErrorsByTokenId.get(token.id) ?? null}
          token={token}
        />
      ))}
    </>
  );
}

function ApiTokenList({
  onRotate,
  onRevoke,
  pendingRevokeIds,
  pendingRotateIds,
  revokeErrorsByTokenId,
  rotateErrorsByTokenId,
  tokens
}: {
  onRotate: (token: ApiTokenSummary, form: HTMLFormElement) => void;
  onRevoke: (tokenId: string) => void;
  pendingRevokeIds: ReadonlySet<string>;
  pendingRotateIds: ReadonlySet<string>;
  revokeErrorsByTokenId: ReadonlyMap<string, string>;
  rotateErrorsByTokenId: ReadonlyMap<string, string>;
  tokens: ApiTokenSummary[];
}) {
  return (
    <ul aria-label="API tokens" {...stylex.props(styles.list)}>
      {tokens.map((token) => (
        <ApiTokenListItem
          key={token.id}
          onRotate={onRotate}
          onRevoke={onRevoke}
          pendingRevokeIds={pendingRevokeIds}
          pendingRotateIds={pendingRotateIds}
          revokeError={revokeErrorsByTokenId.get(token.id) ?? null}
          rotateError={rotateErrorsByTokenId.get(token.id) ?? null}
          token={token}
        />
      ))}
    </ul>
  );
}

function ApiTokenListItem({
  onRotate,
  onRevoke,
  pendingRevokeIds,
  pendingRotateIds,
  revokeError,
  rotateError,
  token
}: {
  onRotate: (token: ApiTokenSummary, form: HTMLFormElement) => void;
  onRevoke: (tokenId: string) => void;
  pendingRevokeIds: ReadonlySet<string>;
  pendingRotateIds: ReadonlySet<string>;
  revokeError: string | null;
  rotateError: string | null;
  token: ApiTokenSummary;
}) {
  const displayLabel = token.label ?? "Unlabeled token";
  const revokePending = pendingRevokeIds.has(token.id);
  const rotatePending = pendingRotateIds.has(token.id);

  function handleRotateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRotate(token, event.currentTarget);
  }

  return (
    <li {...stylex.props(styles.item)}>
      <article {...stylex.props(styles.token)}>
        <h2 {...stylex.props(styles.tokenTitle)}>{displayLabel}</h2>
        <ApiTokenDetails token={token} />
        <ApiTokenRowErrors revokeError={revokeError} rotateError={rotateError} />
        <ApiTokenActions
          displayLabel={displayLabel}
          onRevoke={onRevoke}
          onRotateSubmit={handleRotateSubmit}
          revokePending={revokePending}
          rotatePending={rotatePending}
          token={token}
        />
      </article>
    </li>
  );
}

function ApiTokenDetails({ token }: { token: ApiTokenSummary }) {
  return (
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
        <dd>
          <StatusBadge tone={apiTokenIsActive(token) ? "positive" : "neutral"}>
            {apiTokenStatusLabel(token)}
          </StatusBadge>
        </dd>
      </div>
    </dl>
  );
}

function ApiTokenRowErrors({
  revokeError,
  rotateError
}: {
  revokeError: string | null;
  rotateError: string | null;
}) {
  return (
    <>
      {rotateError ? <p role="alert">{rotateError}</p> : null}
      {revokeError ? <p role="alert">{revokeError}</p> : null}
    </>
  );
}

function ApiTokenActions({
  displayLabel,
  onRevoke,
  onRotateSubmit,
  revokePending,
  rotatePending,
  token
}: {
  displayLabel: string;
  onRevoke: (tokenId: string) => void;
  onRotateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  revokePending: boolean;
  rotatePending: boolean;
  token: ApiTokenSummary;
}) {
  const rotateExpiresAtInputRef = useRef<HTMLInputElement>(null);
  const rotateExpiresAtPresetInputRef = useRef<HTMLInputElement>(null);

  if (token.revokedAt) {
    return null;
  }

  const lifecyclePending = revokePending || rotatePending;
  const tokenActive = apiTokenIsActive(token);

  return (
    <>
      {tokenActive ? (
        <form aria-label={`Rotate ${displayLabel} API token`} onSubmit={onRotateSubmit} {...stylex.props(styles.rotateForm)}>
          <label>
            {`Replacement label for ${displayLabel}`}
            <TextField autoComplete="off" name="label" type="text" />
          </label>
          <label>
            {`Replacement expiry for ${displayLabel}`}
            <input
              name="expiresAt"
              onChange={() => {
                if (rotateExpiresAtPresetInputRef.current) {
                  rotateExpiresAtPresetInputRef.current.value = "";
                }
              }}
              ref={rotateExpiresAtInputRef}
              type="datetime-local"
            />
          </label>
          <input name="expiresAtPreset" ref={rotateExpiresAtPresetInputRef} type="hidden" />
          <div>
            {API_TOKEN_EXPIRES_AT_PRESETS.map((preset) => (
              <Button
                size="1"
                variant="soft"
                key={`${token.id}-${preset.label}`}
                onClick={() => {
                  if (rotateExpiresAtInputRef.current) {
                    rotateExpiresAtInputRef.current.value = buildApiTokenExpiresAtInputValue(
                      preset.label,
                      new Date(Date.now())
                    );
                  }
                  if (rotateExpiresAtPresetInputRef.current) {
                    rotateExpiresAtPresetInputRef.current.value = preset.label;
                  }
                }}
                type="button"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Button disabled={lifecyclePending} type="submit">
            {rotatePending ? "Rotating token..." : "Rotate token"}
          </Button>
        </form>
      ) : null}
      <Button
        color="red"
        disabled={lifecyclePending}
        onClick={() => {
          onRevoke(token.id);
        }}
        type="button"
      >
        {revokePending ? "Revoking token..." : "Revoke token"}
      </Button>
    </>
  );
}

function apiTokenQueryKey(tokenQuery: ApiTokenQueryDescriptor) {
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
  createdTokens: ApiTokenSummary[] = [],
  apiTokenUpdates: ReadonlyMap<string, ApiTokenSummary> = new Map()
) {
  if (loaderData.status === "unauthorized") {
    return {
      localTokens: [],
      statusMessage: "Sign in to manage API tokens.",
      tokens: []
    };
  }

  const loaderTokens = applyApiTokenUpdates(
    loaderData.tokens,
    apiTokenUpdates,
    loaderData.tokenStatus
  );
  const loaderTokenIds = new Set(loaderTokens.map((token) => token.id));
  const localTokens = applyApiTokenUpdates(
    createdTokens,
    apiTokenUpdates,
    loaderData.tokenStatus
  ).filter((token) => !loaderTokenIds.has(token.id));
  const tokens = mergeApiTokenSummaries(localTokens, loaderTokens);

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
  const expiresAt = normalizeExpiresAtFormValue(formData);
  const variables: CreateApiTokenMutation["variables"] = {
    label: optionalFormText(formData.get("label"))
  };

  if (expiresAt !== undefined) {
    variables.expiresAt = expiresAt;
  }

  return variables;
}

function buildRotateApiTokenVariables(
  token: ApiTokenSummary,
  formData: FormData
): RotateApiTokenMutation["variables"] {
  const expiresAt = normalizeExpiresAtFormValue(formData);
  const variables: RotateApiTokenMutation["variables"] = {
    tokenId: token.id,
    label: optionalFormText(formData.get("label")) ?? token.label
  };

  if (expiresAt !== undefined) {
    variables.expiresAt = expiresAt;
  }

  return variables;
}

function normalizeExpiresAtFormValue(formData: FormData) {
  const preset = optionalFormText(formData.get("expiresAtPreset"));

  if (preset === "No expiration") {
    return null;
  }

  return normalizeDateTimeLocalValue(optionalFormText(formData.get("expiresAt")));
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
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function apiTokenStatusLabel(token: ApiTokenSummary) {
  if (token.revokedAt) {
    return "Revoked token";
  }

  return apiTokenIsActive(token) ? "Active token" : "Expired token";
}

function apiTokenIsActive(token: ApiTokenSummary) {
  if (token.revokedAt) {
    return false;
  }

  if (!token.expiresAt) {
    return true;
  }

  const expiresAt = new Date(token.expiresAt).getTime();
  return Number.isNaN(expiresAt) || expiresAt > Date.now();
}

type MutationApiToken = {
  readonly id: string;
  readonly label: string | null | undefined;
  readonly tokenPrefix: string;
  readonly lastUsedAt: string | null | undefined;
  readonly expiresAt: string | null | undefined;
  readonly revokedAt: string | null | undefined;
  readonly insertedAt: string;
};

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

function markTokenRotated(previousToken: ApiTokenSummary, rotatedToken: ApiTokenSummary) {
  return {
    ...previousToken,
    revokedAt: previousToken.revokedAt ?? rotatedToken.insertedAt
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
    return apiTokenIsActive(token);
  }

  return token.revokedAt !== null;
}

function applyApiTokenUpdates(
  tokens: ApiTokenSummary[],
  apiTokenUpdates: ReadonlyMap<string, ApiTokenSummary>,
  status: ApiTokensRouteLoaderData["tokenStatus"]
) {
  return tokens.flatMap((token) => {
    const updatedToken = mergeApiTokenUpdate(token, apiTokenUpdates.get(token.id));
    return apiTokenMatchesStatus(updatedToken, status) ? [updatedToken] : [];
  });
}

function mergeApiTokenUpdate(
  token: ApiTokenSummary,
  updatedToken: ApiTokenSummary | undefined
) {
  if (!updatedToken) {
    return token;
  }

  return {
    ...token,
    revokedAt: token.revokedAt ?? updatedToken.revokedAt
  } satisfies ApiTokenSummary;
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

function upsertApiTokenSummaryMap(
  tokens: ReadonlyMap<string, ApiTokenSummary>,
  nextToken: ApiTokenSummary
) {
  const nextTokens = new Map(tokens);
  nextTokens.set(nextToken.id, nextToken);
  return nextTokens;
}

function upsertMapValue<K, V>(
  values: ReadonlyMap<K, V>,
  key: K,
  value: V
): ReadonlyMap<K, V> {
  const nextValues = new Map(values);
  nextValues.set(key, value);
  return nextValues;
}

function removeMapValue<K, V>(values: ReadonlyMap<K, V>, key: K): ReadonlyMap<K, V> {
  if (!values.has(key)) {
    return values;
  }

  const nextValues = new Map(values);
  nextValues.delete(key);
  return nextValues;
}

function addSetValue<T>(currentValues: ReadonlySet<T>, nextValue: T): ReadonlySet<T> {
  if (currentValues.has(nextValue)) {
    return currentValues;
  }

  return new Set(currentValues).add(nextValue);
}

function removeSetValue<T>(currentValues: ReadonlySet<T>, removedValue: T): ReadonlySet<T> {
  if (!currentValues.has(removedValue)) {
    return currentValues;
  }

  const nextValues = new Set(currentValues);
  nextValues.delete(removedValue);
  return nextValues;
}
