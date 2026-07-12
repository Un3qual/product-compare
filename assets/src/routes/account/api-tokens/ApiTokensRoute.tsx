import { type FormEvent, type RefObject, useMemo, useRef, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData } from "react-router-dom";
import { useMutation } from "react-relay";
import createApiTokenMutation, {
  type CreateApiTokenMutation
} from "../../../__generated__/CreateApiTokenMutation.graphql";
import revokeApiTokenMutation, {
  type RevokeApiTokenMutation
} from "../../../__generated__/RevokeApiTokenMutation.graphql";
import rotateApiTokenMutation, {
  type RotateApiTokenMutation
} from "../../../__generated__/RotateApiTokenMutation.graphql";
import { ResettableErrorBoundary } from "../../../relay/ResettableErrorBoundary";
import { ContextRail } from "../../../ui/components/layout/ContextRail";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../../ui/components/layout/WorkspaceLayout";
import { Pagination } from "../../../ui/components/navigation/Pagination";
import { ActionDialog } from "../../../ui/components/overlays/ActionDialog";
import { Button } from "../../../ui/primitives/Button";
import { TextField } from "../../../ui/primitives/TextField";
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
import {
  ApiTokenList,
  RelayApiTokenList,
  apiTokenIsActive,
  applyApiTokenUpdates
} from "./ApiTokenList";
import type { ApiTokenSummary, ApiTokensRouteLoaderData } from "./loader";
import { apiTokensLoader } from "./loader";

const STATUS_FILTERS = [
  { label: "All", status: "all" },
  { label: "Active", status: "active" },
  { label: "Revoked", status: "revoked" }
] as const;

const styles = create({
  createForm: {
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-large)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
    padding: "1.15rem"
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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
        setCreateDialogOpen(false);
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
        <WorkspaceLayout
          context={
            <ContextRail
              description="Filter credentials by status or create an API token."
              label="API token controls"
            >
              <ApiTokenStatusFilters tokenStatus={loaderData.tokenStatus} />
              <ActionDialog
                description="Choose a clear label and expiration for this credential."
                onOpenChange={setCreateDialogOpen}
                open={createDialogOpen}
                title="Create API token"
                trigger={<Button>Create API token</Button>}
              >
                <CreateApiTokenForm
                  expiresAtInputRef={createExpiresAtInputRef}
                  expiresAtPresetInputRef={createExpiresAtPresetInputRef}
                  onSubmit={handleCreate}
                  submitting={createSubmitting}
                />
                {createError ? <p role="alert">{createError}</p> : null}
              </ActionDialog>
            </ContextRail>
          }
          label="API token records"
        >
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
        </WorkspaceLayout>
      )}
    </PageShell>
  );
}

function CreateApiTokenForm({
  expiresAtInputRef,
  expiresAtPresetInputRef,
  onSubmit,
  submitting
}: {
  expiresAtInputRef: RefObject<HTMLInputElement | null>;
  expiresAtPresetInputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
}) {
  return (
    <form aria-label="Create API token" onSubmit={onSubmit} {...props(styles.createForm)}>
      <div>
        <span id="api-token-label">Label</span>
        <TextField
          aria-labelledby="api-token-label"
          autoComplete="off"
          name="label"
          type="text"
        />
      </div>
      <label>
        Expires at
        <input
          name="expiresAt"
          onChange={() => {
            if (expiresAtPresetInputRef.current) {
              expiresAtPresetInputRef.current.value = "";
            }
          }}
          ref={expiresAtInputRef}
          type="datetime-local"
        />
      </label>
      <input name="expiresAtPreset" ref={expiresAtPresetInputRef} type="hidden" />
      <div>
        {API_TOKEN_EXPIRES_AT_PRESETS.map((preset) => (
          <Button
            size="1"
            variant="soft"
            key={preset.label}
            onClick={() => {
              if (expiresAtInputRef.current) {
                expiresAtInputRef.current.value = buildApiTokenExpiresAtInputValue(
                  preset.label,
                  new Date(Date.now())
                );
              }
              if (expiresAtPresetInputRef.current) {
                expiresAtPresetInputRef.current.value = preset.label;
              }
            }}
            type="button"
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <Button disabled={submitting} type="submit">
        {submitting ? "Creating API token..." : "Create API token"}
      </Button>
    </form>
  );
}

function ApiTokenStatusFilters({
  tokenStatus
}: {
  tokenStatus: ApiTokensRouteLoaderData["tokenStatus"];
}) {
  return (
    <nav aria-label="API token status filters">
      <ul>
        {STATUS_FILTERS.map((filter) => (
          <li key={filter.status}>
            <Link
              aria-current={tokenStatus === filter.status ? "page" : undefined}
              to={`/account/api-tokens?status=${filter.status}`}
            >
              {filter.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
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
