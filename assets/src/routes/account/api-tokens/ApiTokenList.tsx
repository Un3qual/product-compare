import { create, props } from "@stylexjs/stylex";
import type { ApiTokenItem_token$key } from "$generated/ApiTokenItem_token.graphql";
import { ApiTokenItem, ApiTokenSummaryItem } from "./ApiTokenItem";
import {
  applyApiTokenUpdates,
  type ApiTokenRecord,
  type ApiTokenStatus,
} from "./api-token-route-data";

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
      {serverTokens.map((fragmentRef) => {
        const tokenUpdate = apiTokenUpdates.get(fragmentRef.id);

        if (tokenUpdate) {
          const [visibleUpdate] = applyApiTokenUpdates([tokenUpdate], new Map(), tokenStatus);

          return visibleUpdate ? (
            <ApiTokenItem
              key={fragmentRef.id}
              onRotate={onRotate}
              onRevoke={onRevoke}
              revokePending={pendingRevokeIds.has(fragmentRef.id)}
              rotatePending={pendingRotateIds.has(fragmentRef.id)}
              revokeError={revokeErrorsByTokenId.get(fragmentRef.id) ?? null}
              rotateError={rotateErrorsByTokenId.get(fragmentRef.id) ?? null}
              token={fragmentRef}
              tokenUpdate={tokenUpdate}
            />
          ) : null;
        }

        return (
          <ApiTokenItem
            key={fragmentRef.id}
            onRotate={onRotate}
            onRevoke={onRevoke}
            revokePending={pendingRevokeIds.has(fragmentRef.id)}
            rotatePending={pendingRotateIds.has(fragmentRef.id)}
            revokeError={revokeErrorsByTokenId.get(fragmentRef.id) ?? null}
            rotateError={rotateErrorsByTokenId.get(fragmentRef.id) ?? null}
            token={fragmentRef}
          />
        );
      })}
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
