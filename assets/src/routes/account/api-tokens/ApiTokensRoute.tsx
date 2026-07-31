import { type FormEvent, useMemo, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { useMutation } from "react-relay";
import type { ApiTokenOperationsCreateApiTokenMutation } from "../../../__generated__/ApiTokenOperationsCreateApiTokenMutation.graphql";
import type { ApiTokenOperationsRevokeApiTokenMutation } from "../../../__generated__/ApiTokenOperationsRevokeApiTokenMutation.graphql";
import type { ApiTokenOperationsRotateApiTokenMutation } from "../../../__generated__/ApiTokenOperationsRotateApiTokenMutation.graphql";
import { ResettableErrorBoundary } from "../../../relay/ResettableErrorBoundary";
import { ContextRail } from "../../../ui/components/layout/ContextRail";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../../ui/components/layout/WorkspaceLayout";
import { Pagination } from "../../../ui/components/navigation/Pagination";
import { commitRouteMutation, commitRouteMutationPromise } from "../../relay-mutations";
import {
  addSetValue,
  removeMapValue,
  removeSetValue,
  upsertMapValue
} from "../../immutable-collection-state";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE
} from "../../route-errors";
import {
  ApiTokenList,
  RelayApiTokenList
} from "./ApiTokenList";
import { ApiTokenControls, OneTimeApiToken } from "./ApiTokenControls";
import {
  createApiTokenMutation,
  revokeApiTokenMutation,
  rotateApiTokenMutation
} from "./ApiTokenOperations";
import {
  apiTokensRouteLocationIdentity,
  buildApiTokenPaginationData,
  buildApiTokensViewState,
  buildCreateApiTokenVariables,
  buildRotateApiTokenVariables,
  markTokenRotated,
  resolveApiTokenCredentialMutationOutcome,
  resolveRevokeApiTokenMutationOutcome,
  upsertApiTokenSummary,
  upsertApiTokenSummaryMap
} from "./api-token-route-data";
import { apiTokenIsActive } from "./api-token-status";
import type { ApiTokenSummary, ApiTokensRouteLoaderData } from "./loader";
import type { apiTokensLoader } from "./loader";

export function ApiTokensRoute() {
  const loaderData = useLoaderData<typeof apiTokensLoader>();

  return (
    <ApiTokensRoutePage
      key={apiTokensRouteLocationIdentity(loaderData)}
      loaderData={loaderData}
    />
  );
}

function ApiTokensRoutePage({ loaderData }: { loaderData: ApiTokensRouteLoaderData }) {
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
  const [commitCreateApiToken, createMutationPending] = useMutation<ApiTokenOperationsCreateApiTokenMutation>(
    createApiTokenMutation
  );
  const [commitRevokeApiToken] = useMutation<ApiTokenOperationsRevokeApiTokenMutation>(revokeApiTokenMutation);
  const [commitRotateApiToken] = useMutation<ApiTokenOperationsRotateApiTokenMutation>(rotateApiTokenMutation);
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
      const outcome = resolveApiTokenCredentialMutationOutcome(payload, graphQLErrors);

      if (outcome.error === null) {
        setCreateError(null);
        setCreatedTokens((currentTokens) => upsertApiTokenSummary(currentTokens, outcome.token));
        setOneTimeToken(outcome.plainTextToken);
        setCreateDialogOpen(false);
        form.reset();
      } else {
        setCreateError(outcome.error);
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
          const outcome = resolveApiTokenCredentialMutationOutcome(payload, graphQLErrors);

          if (outcome.error === null) {
            const revokedPreviousToken = markTokenRotated(token, outcome.token);

            setRotateErrorsByTokenId((currentErrors) => removeMapValue(currentErrors, token.id));
            setCreatedTokens((currentTokens) =>
              upsertApiTokenSummary(currentTokens, outcome.token)
            );
            setApiTokenUpdates((currentUpdates) =>
              upsertApiTokenSummaryMap(
                upsertApiTokenSummaryMap(currentUpdates, outcome.token),
                revokedPreviousToken
              )
            );
            setOneTimeToken(outcome.plainTextToken);
            form.reset();
          } else {
            setRotateErrorsByTokenId((currentErrors) =>
              upsertMapValue(currentErrors, token.id, outcome.error)
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
        variables: { tokenId },
        onCompleted: (response, graphQLErrors) => {
          const payload = response.revokeApiToken;
          const outcome = resolveRevokeApiTokenMutationOutcome(payload, graphQLErrors);

          if (outcome.error === null) {
            setRevokeErrorsByTokenId((currentErrors) => removeMapValue(currentErrors, tokenId));
            setApiTokenUpdates((currentUpdates) =>
              upsertApiTokenSummaryMap(currentUpdates, outcome.token)
            );
          } else {
            setRevokeErrorsByTokenId((currentErrors) =>
              upsertMapValue(currentErrors, tokenId, outcome.error)
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
              <ApiTokenControls
                createDialogOpen={createDialogOpen}
                createError={createError}
                expiresAtInputRef={createExpiresAtInputRef}
                expiresAtPresetInputRef={createExpiresAtPresetInputRef}
                onCreate={handleCreate}
                onCreateDialogOpenChange={setCreateDialogOpen}
                submitting={createSubmitting}
                tokenStatus={loaderData.tokenStatus}
              />
            </ContextRail>
          }
          label="API token records"
        >
          {oneTimeToken ? <OneTimeApiToken token={oneTimeToken} /> : null}

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
  const paginationData = buildApiTokenPaginationData({
    after,
    endCursor,
    hasNextPage,
    tokenStatus
  });

  return (
    <Pagination
      firstHref={paginationData.firstHref}
      label="API token pages"
      nextHref={paginationData.nextHref}
    />
  );
}
