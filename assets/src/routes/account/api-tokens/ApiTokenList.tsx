import { Suspense, type FormEvent, useId, useRef } from "react";
import { create, props } from "@stylexjs/stylex";
import { usePreloadedQuery } from "react-relay";
import apiTokensRouteQuery, {
  type ApiTokensRouteQuery
} from "../../../__generated__/ApiTokensRouteQuery.graphql";
import { stableJsonValue, useRoutePreloadedQuery } from "../../../relay/route-preload";
import { StatusBadge } from "../../../ui/components/status/StatusBadge";
import { Button } from "../../../ui/primitives/Button";
import { TextField } from "../../../ui/primitives/TextField";
import { tokens } from "../../../ui/theme/tokens.stylex";
import {
  API_TOKEN_EXPIRES_AT_PRESETS,
  buildApiTokenExpiresAtInputValue
} from "./date-presets";
import type { ApiTokenQueryDescriptor, ApiTokenSummary, ApiTokensRouteLoaderData } from "./loader";
import { summarizeApiTokensPage } from "./loader";

const styles = create({
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
    borderRadius: "var(--pc-radius-medium)",
    display: "grid",
    gap: "0.75rem",
    padding: "0.9rem"
  }
});

export type ApiTokenListLifecycleProps = {
  onRotate: (token: ApiTokenSummary, form: HTMLFormElement) => void;
  onRevoke: (tokenId: string) => void;
  pendingRevokeIds: ReadonlySet<string>;
  pendingRotateIds: ReadonlySet<string>;
  revokeErrorsByTokenId: ReadonlyMap<string, string>;
  rotateErrorsByTokenId: ReadonlyMap<string, string>;
};

type RelayApiTokenListProps = ApiTokenListLifecycleProps & {
  apiTokenUpdates: ReadonlyMap<string, ApiTokenSummary>;
  localTokens: ApiTokenSummary[];
  tokenStatus: ApiTokensRouteLoaderData["tokenStatus"];
  tokenQueries: ApiTokenQueryDescriptor[];
};

export function RelayApiTokenList(props: RelayApiTokenListProps) {
  return (
    <Suspense fallback={<p role="status">Loading API tokens...</p>}>
      <RelayApiTokenListContent {...props} />
    </Suspense>
  );
}

function RelayApiTokenListContent(relayProps: RelayApiTokenListProps) {
  const {
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
  } = relayProps;

  return (
    <ul aria-label="API tokens" {...props(styles.list)}>
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

function RelayApiTokenPage(props: ApiTokenListLifecycleProps & {
  apiTokenUpdates: ReadonlyMap<string, ApiTokenSummary>;
  tokenQuery: ApiTokenQueryDescriptor;
  tokenStatus: ApiTokensRouteLoaderData["tokenStatus"];
}) {
  const {
    apiTokenUpdates,
    onRotate,
    onRevoke,
    pendingRevokeIds,
    pendingRotateIds,
    revokeErrorsByTokenId,
    rotateErrorsByTokenId,
    tokenQuery,
    tokenStatus
  } = props;
  const queryRef = useRoutePreloadedQuery<ApiTokensRouteQuery>(
    apiTokensRouteQuery,
    tokenQuery
  );
  const data = usePreloadedQuery<ApiTokensRouteQuery>(apiTokensRouteQuery, queryRef);
  const page = summarizeApiTokensPage(data);
  const tokens = applyApiTokenUpdates(page.tokens, apiTokenUpdates, tokenStatus);

  return tokens.map((token) => (
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
  ));
}

export function ApiTokenList({
  onRotate,
  onRevoke,
  pendingRevokeIds,
  pendingRotateIds,
  revokeErrorsByTokenId,
  rotateErrorsByTokenId,
  tokens
}: ApiTokenListLifecycleProps & { tokens: ApiTokenSummary[] }) {
  return (
    <ul aria-label="API tokens" {...props(styles.list)}>
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
}: Omit<ApiTokenListLifecycleProps, "revokeErrorsByTokenId" | "rotateErrorsByTokenId"> & {
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
    <li {...props(styles.item)}>
      <article {...props(styles.token)}>
        <h2 {...props(styles.tokenTitle)}>{displayLabel}</h2>
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
  const rotateLabelInputId = useId();
  const rotateLabelId = `${rotateLabelInputId}-label`;

  if (token.revokedAt) {
    return null;
  }

  const lifecyclePending = revokePending || rotatePending;
  const tokenActive = apiTokenIsActive(token);

  return (
    <>
      {tokenActive ? (
        <form
          aria-label={`Rotate ${displayLabel} API token`}
          onSubmit={onRotateSubmit}
          {...props(styles.rotateForm)}
        >
          <div>
            <span id={rotateLabelId}>{`Replacement label for ${displayLabel}`}</span>
            <TextField
              aria-labelledby={rotateLabelId}
              autoComplete="off"
              id={rotateLabelInputId}
              name="label"
              type="text"
            />
          </div>
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
        disabled={lifecyclePending}
        onClick={() => onRevoke(token.id)}
        tone="danger"
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

function apiTokenStatusLabel(token: ApiTokenSummary) {
  if (token.revokedAt) {
    return "Revoked token";
  }

  return apiTokenIsActive(token) ? "Active token" : "Expired token";
}

export function apiTokenIsActive(token: ApiTokenSummary) {
  if (token.revokedAt) {
    return false;
  }

  if (!token.expiresAt) {
    return true;
  }

  const expiresAt = new Date(token.expiresAt).getTime();
  return Number.isNaN(expiresAt) || expiresAt > Date.now();
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

export function applyApiTokenUpdates(
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
