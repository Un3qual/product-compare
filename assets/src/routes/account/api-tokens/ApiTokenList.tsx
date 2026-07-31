import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import { usePreloadedQuery } from "react-relay";
import type { ApiTokenOperationsQuery } from "../../../__generated__/ApiTokenOperationsQuery.graphql";
import {
  relayRouteQueryDescriptorIdentity,
  useRoutePreloadedQuery
} from "../../../relay/route-preload";
import { ApiTokenItem } from "./ApiTokenItem";
import { apiTokenOperationsQuery } from "./ApiTokenOperations";
import { applyApiTokenUpdates } from "./api-token-route-data";
import type { ApiTokenQueryDescriptor, ApiTokenSummary, ApiTokensRouteLoaderData } from "./loader";
import { summarizeApiTokensPage } from "./loader";

const styles = create({
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0
  }
});

type ApiTokenListLifecycleProps = {
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
        <ApiTokenItem
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
      {tokenQueries.map((tokenQuery) => (
        <RelayApiTokenPage
          apiTokenUpdates={apiTokenUpdates}
          key={relayRouteQueryDescriptorIdentity(tokenQuery)}
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
  const queryRef = useRoutePreloadedQuery<ApiTokenOperationsQuery>(
    apiTokenOperationsQuery,
    tokenQuery
  );
  const data = usePreloadedQuery<ApiTokenOperationsQuery>(apiTokenOperationsQuery, queryRef);
  const page = summarizeApiTokensPage(data);
  const tokens = applyApiTokenUpdates(page.tokens, apiTokenUpdates, tokenStatus);

  return tokens.map((token) => (
    <ApiTokenItem
      key={token.id}
      onRotate={onRotate}
      onRevoke={onRevoke}
      revokePending={pendingRevokeIds.has(token.id)}
      rotatePending={pendingRotateIds.has(token.id)}
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
        <ApiTokenItem
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
