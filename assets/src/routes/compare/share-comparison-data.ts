export interface PublishedComparisonSnapshot {
  id: string;
  path: string;
  title: string | null;
}

export interface ComparisonSnapshotPublishInput {
  productIds: readonly string[];
  recommendationProfile: "BEST_VALUE" | "LOWEST_CURRENT_COST";
  searchIndexable: boolean;
  title?: string;
}

export function buildComparisonSnapshotPublishInput({
  productIds,
  recommendationProfile,
  searchIndexable,
  title: rawTitle
}: {
  productIds: readonly string[];
  recommendationProfile: "best_value" | "lowest_current_cost";
  searchIndexable: boolean;
  title: unknown;
}): ComparisonSnapshotPublishInput {
  const title = String(rawTitle ?? "").trim();

  return {
    productIds,
    recommendationProfile:
      recommendationProfile === "best_value" ? "BEST_VALUE" : "LOWEST_CURRENT_COST",
    searchIndexable,
    ...(title ? { title } : {})
  };
}

export function mergeComparisonSnapshots(
  groups: ReadonlyArray<readonly PublishedComparisonSnapshot[]>,
  revokedSnapshotIds: ReadonlySet<string> = new Set()
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
  page: readonly PublishedComparisonSnapshot[]
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

export function removeComparisonSnapshotId(ids: ReadonlySet<string>, id: string) {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

export function comparisonSnapshotLabel(snapshot: PublishedComparisonSnapshot) {
  return snapshot.title || "Open public snapshot";
}
