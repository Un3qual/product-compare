import { create, props } from "@stylexjs/stylex";
import type { ApiTokenItem_token$key } from "$generated/ApiTokenItem_token.graphql";
import { ApiTokenItem, ApiTokenSummaryItem } from "./ApiTokenItem";
import {
  applyApiTokenUpdates,
  type ApiTokenRecord,
  type ApiTokenStatus,
} from "../api-token-lifecycle";

const styles = create({
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
});

type ApiTokenListLifecycleProps = {
  onRotate: (token: ApiTokenRecord, form: HTMLFormElement) => void;
  onRevoke: (tokenId: string) => void;
  pendingRevokeIds: ReadonlySet<string>;
  pendingRotateIds: ReadonlySet<string>;
  revokeErrorsByTokenId: ReadonlyMap<string, string>;
  rotateErrorsByTokenId: ReadonlyMap<string, string>;
};

type RelayApiTokenListProps = ApiTokenListLifecycleProps & {
  apiTokenUpdates: ReadonlyMap<string, ApiTokenRecord>;
  localTokens: ApiTokenRecord[];
  serverTokens: readonly (ApiTokenItem_token$key & { readonly id: string })[];
  tokenStatus: ApiTokenStatus;
};

type RelayApiTokenRowProps = {
  fragmentRef: ApiTokenItem_token$key & { readonly id: string };
  lifecycle: ApiTokenListLifecycleProps;
  tokenStatus: ApiTokenStatus;
  tokenUpdate: ApiTokenRecord | undefined;
};

function RelayApiTokenRow({
  fragmentRef,
  lifecycle,
  tokenStatus,
  tokenUpdate,
}: RelayApiTokenRowProps) {
  const tokenId = fragmentRef.id;
  const {
    onRotate,
    onRevoke,
    pendingRevokeIds,
    pendingRotateIds,
    revokeErrorsByTokenId,
    rotateErrorsByTokenId,
  } = lifecycle;

  if (tokenUpdate) {
    const [visibleUpdate] = applyApiTokenUpdates([tokenUpdate], new Map(), tokenStatus);

    if (!visibleUpdate) return null;
  }

  return (
    <ApiTokenItem
      onRotate={onRotate}
      onRevoke={onRevoke}
      revokePending={pendingRevokeIds.has(tokenId)}
      rotatePending={pendingRotateIds.has(tokenId)}
      revokeError={revokeErrorsByTokenId.get(tokenId) ?? null}
      rotateError={rotateErrorsByTokenId.get(tokenId) ?? null}
      token={fragmentRef}
      tokenUpdate={tokenUpdate}
    />
  );
}

export function RelayApiTokenList(relayProps: RelayApiTokenListProps) {
  const {
    apiTokenUpdates,
    localTokens,
    onRotate,
    onRevoke,
    pendingRevokeIds,
    pendingRotateIds,
    revokeErrorsByTokenId,
    rotateErrorsByTokenId,
    serverTokens,
    tokenStatus,
  } = relayProps;
  const lifecycle = {
    onRotate,
    onRevoke,
    pendingRevokeIds,
    pendingRotateIds,
    revokeErrorsByTokenId,
    rotateErrorsByTokenId,
  };

  return (
    <ul aria-label="API tokens" {...props(styles.list)}>
      {localTokens.map((token) => (
        <ApiTokenSummaryItem
          key={token.id}
          onRotate={onRotate}
          onRevoke={onRevoke}
          revokePending={pendingRevokeIds.has(token.id)}
          rotatePending={pendingRotateIds.has(token.id)}
          revokeError={revokeErrorsByTokenId.get(token.id) ?? null}
          rotateError={rotateErrorsByTokenId.get(token.id) ?? null}
          token={token}
        />
      ))}
      {serverTokens.map((fragmentRef) => (
        <RelayApiTokenRow
          fragmentRef={fragmentRef}
          key={fragmentRef.id}
          lifecycle={lifecycle}
          tokenStatus={tokenStatus}
          tokenUpdate={apiTokenUpdates.get(fragmentRef.id)}
        />
      ))}
    </ul>
  );
}

export function ApiTokenList({
  onRotate,
  onRevoke,
  pendingRevokeIds,
  pendingRotateIds,
  revokeErrorsByTokenId,
  rotateErrorsByTokenId,
  tokens,
}: ApiTokenListLifecycleProps & { tokens: ApiTokenRecord[] }) {
  return (
    <ul aria-label="API tokens" {...props(styles.list)}>
      {tokens.map((token) => (
        <ApiTokenSummaryItem
          key={token.id}
          onRotate={onRotate}
          onRevoke={onRevoke}
          revokePending={pendingRevokeIds.has(token.id)}
          rotatePending={pendingRotateIds.has(token.id)}
          revokeError={revokeErrorsByTokenId.get(token.id) ?? null}
          rotateError={rotateErrorsByTokenId.get(token.id) ?? null}
          token={token}
        />
      ))}
    </ul>
  );
}
