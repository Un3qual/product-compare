import type { ComparisonSharingOperationsPublishComparisonSnapshotMutation } from "$generated/ComparisonSharingOperationsPublishComparisonSnapshotMutation.graphql";
import type { ComparisonSharingOperationsQuery } from "$generated/ComparisonSharingOperationsQuery.graphql";
import type { ComparisonSharingOperationsRevokeComparisonSnapshotMutation } from "$generated/ComparisonSharingOperationsRevokeComparisonSnapshotMutation.graphql";
import {
  hasGraphQLErrors,
  mutationErrorMessage,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";

export interface PublishedComparisonSnapshot {
  id: string;
  path: string;
  title: string | null;
}

export interface ComparisonSnapshotState {
  message: string | null;
  published: readonly PublishedComparisonSnapshot[];
  revokedSnapshotIds: ReadonlySet<string>;
}

type GeneratedSnapshotConnection = NonNullable<
  ComparisonSharingOperationsQuery["response"]["viewer"]
>["comparisonSnapshots"];
export type ComparisonSnapshotPageConnection = Pick<GeneratedSnapshotConnection, "pageInfo">;

export type ComparisonSnapshotMutationOutcome =
  | { readonly error: null; readonly snapshot: PublishedComparisonSnapshot }
  | { readonly error: string; readonly snapshot: null };

export type ComparisonSnapshotSourceNode = NonNullable<
  GeneratedSnapshotConnection["edges"][number]["node"]
>;

export const PUBLISHED_COMPARISON_SNAPSHOT_SUCCESS_MESSAGE =
  "Public comparison link published. Its product details and prices will remain unchanged.";
export const REVOKED_COMPARISON_SNAPSHOT_SUCCESS_MESSAGE =
  "Public comparison link revoked. The old link now returns not found.";

export function buildComparisonSnapshotPublishInput({
  productIds,
  recommendationProfile,
  searchIndexable,
  title: rawTitle,
}: {
  productIds: readonly string[];
  recommendationProfile: "best_value" | "lowest_current_cost";
  searchIndexable: boolean;
  title: unknown;
}): ComparisonSharingOperationsPublishComparisonSnapshotMutation["variables"]["input"] {
  const title = String(rawTitle ?? "").trim();

  return {
    productIds,
    recommendationProfile:
      recommendationProfile === "best_value" ? "BEST_VALUE" : "LOWEST_CURRENT_COST",
    searchIndexable,
    ...(title ? { title } : {}),
  };
}

export function publishedSnapshotFromPayload(
  payload: ComparisonSharingOperationsPublishComparisonSnapshotMutation["response"]["publishComparisonSnapshot"],
  title: string | null,
): PublishedComparisonSnapshot | null {
  return payload.snapshot?.id && payload.sharePath
    ? { id: payload.snapshot.id, path: payload.sharePath, title }
    : null;
}

export function resolvePublishComparisonSnapshotMutationOutcome(
  payload: ComparisonSharingOperationsPublishComparisonSnapshotMutation["response"]["publishComparisonSnapshot"],
  title: string | null,
  graphQLErrors: MutationGraphQLErrors = null,
): ComparisonSnapshotMutationOutcome {
  const snapshot = publishedSnapshotFromPayload(payload, title);

  return snapshot && !hasGraphQLErrors(graphQLErrors)
    ? { error: null, snapshot }
    : {
        error: mutationErrorMessage(payload.errors, graphQLErrors),
        snapshot: null,
      };
}

export function resolveRevokeComparisonSnapshotMutationOutcome(
  payload: ComparisonSharingOperationsRevokeComparisonSnapshotMutation["response"]["revokeComparisonSnapshot"],
  snapshot: PublishedComparisonSnapshot,
  graphQLErrors: MutationGraphQLErrors = null,
): ComparisonSnapshotMutationOutcome {
  return payload.revokedSnapshotId === snapshot.id && !hasGraphQLErrors(graphQLErrors)
    ? { error: null, snapshot }
    : {
        error: mutationErrorMessage(payload.errors, graphQLErrors),
        snapshot: null,
      };
}

export function snapshotFromNode(node: ComparisonSnapshotSourceNode): PublishedComparisonSnapshot {
  return { id: node.id, path: node.sharePath, title: node.title };
}

export function publishComparisonSnapshotState(
  state: ComparisonSnapshotState,
  snapshot: PublishedComparisonSnapshot,
) {
  return {
    published: [snapshot, ...state.published.filter(({ id }) => id !== snapshot.id)],
    revokedSnapshotIds: removeComparisonSnapshotId(state.revokedSnapshotIds, snapshot.id),
    message: PUBLISHED_COMPARISON_SNAPSHOT_SUCCESS_MESSAGE,
  };
}

export function revokeComparisonSnapshotState(
  state: ComparisonSnapshotState,
  snapshot: PublishedComparisonSnapshot,
) {
  return {
    published: state.published.filter(({ id }) => id !== snapshot.id),
    revokedSnapshotIds: new Set(state.revokedSnapshotIds).add(snapshot.id),
    message: REVOKED_COMPARISON_SNAPSHOT_SUCCESS_MESSAGE,
  };
}

export function mergeComparisonSnapshots(
  groups: ReadonlyArray<readonly PublishedComparisonSnapshot[]>,
  revokedSnapshotIds: ReadonlySet<string> = new Set(),
) {
  const snapshots: PublishedComparisonSnapshot[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const snapshot of group) {
      if (!seen.has(snapshot.id) && !revokedSnapshotIds.has(snapshot.id)) {
        seen.add(snapshot.id);
        snapshots.push(snapshot);
      }
    }
  }

  return snapshots;
}

export function appendComparisonSnapshotPage(
  current: PublishedComparisonSnapshot[],
  page: readonly PublishedComparisonSnapshot[],
) {
  const seen = new Set(current.map(({ id }) => id));
  const additions: PublishedComparisonSnapshot[] = [];

  for (const snapshot of page) {
    if (!seen.has(snapshot.id)) {
      seen.add(snapshot.id);
      additions.push(snapshot);
    }
  }

  return additions.length ? [...current, ...additions] : current;
}

export function nextComparisonSnapshotCursor(
  connection: ComparisonSnapshotPageConnection | null,
  after: string | null,
) {
  const pageInfo = connection?.pageInfo;
  const endCursor = pageInfo?.endCursor;

  if (!pageInfo?.hasNextPage || !endCursor?.trim() || endCursor === after) return null;
  return endCursor;
}

export function removeComparisonSnapshotId(ids: ReadonlySet<string>, id: string) {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

export function snapshotRevocationCanStart(
  pendingSnapshotIds: ReadonlySet<string>,
  snapshotId: string,
) {
  return !pendingSnapshotIds.has(snapshotId);
}

export function snapshotRevocationRowState(
  snapshotId: string,
  pendingSnapshotIds: ReadonlySet<string>,
  errorsBySnapshotId: ReadonlyMap<string, string>,
) {
  const pending = pendingSnapshotIds.has(snapshotId);

  return {
    buttonCopy: pending ? "Revoking…" : "Revoke public link",
    disabled: pending,
    error: errorsBySnapshotId.get(snapshotId) ?? null,
  };
}

export function comparisonSnapshotLabel(snapshot: PublishedComparisonSnapshot) {
  return snapshot.title || "Open public comparison";
}
