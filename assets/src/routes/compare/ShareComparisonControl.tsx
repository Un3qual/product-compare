import { Suspense, type FormEvent, useEffect, useId, useMemo, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLocation } from "react-router-dom";
import { useLazyLoadQuery, useMutation } from "react-relay";
import type { OwnedComparisonSnapshotsQuery } from "../../__generated__/OwnedComparisonSnapshotsQuery.graphql";
import type { PublishComparisonSnapshotMutation } from "../../__generated__/PublishComparisonSnapshotMutation.graphql";
import type { RevokeComparisonSnapshotMutation } from "../../__generated__/RevokeComparisonSnapshotMutation.graphql";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE, routeMutationErrorMessage } from "../route-errors";
import type { CompareProductSummary } from "./loader";
import { recommendationProfileFromUrl } from "./loader";
import ownedComparisonSnapshotsQuery from "./queries/OwnedComparisonSnapshotsQuery";
import publishComparisonSnapshotMutation from "./queries/PublishComparisonSnapshotMutation";
import revokeComparisonSnapshotMutation from "./queries/RevokeComparisonSnapshotMutation";

const SNAPSHOT_PAGE_SIZE = 20;

interface PublishedComparisonSnapshot {
  id: string;
  path: string;
  title: string | null;
}

type OwnedSnapshotNode = NonNullable<
  OwnedComparisonSnapshotsQuery["response"]["viewer"]
>["comparisonSnapshots"]["edges"][number]["node"];

const styles = create({
  control: { borderBlockStart: "1px solid var(--pc-border-quiet)", paddingBlockStart: "0.85rem" },
  field: { display: "grid", gap: "0.35rem" },
  form: { display: "grid", gap: "0.75rem", paddingBlockStart: "0.8rem" },
  input: { backgroundColor: "var(--pc-surface)", border: "1px solid var(--pc-border-emphasized)", borderRadius: "0.4rem", color: "var(--pc-text)", minHeight: "2.6rem", paddingInline: "0.7rem" },
  list: { display: "grid", gap: "0.65rem", listStyle: "none", margin: 0, padding: 0 },
  listItem: { alignItems: "center", display: "flex", flexWrap: "wrap", gap: "0.6rem", justifyContent: "space-between" },
  message: { color: "var(--pc-text-secondary)", margin: 0 },
  summary: { cursor: "pointer", fontWeight: 650 }
});

export function ShareComparisonControl({
  products
}: {
  products: readonly CompareProductSummary[];
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [published, setPublished] = useState<PublishedComparisonSnapshot[]>([]);
  const [revokedSnapshotIds, setRevokedSnapshotIds] = useState<Set<string>>(
    () => new Set()
  );
  const [message, setMessage] = useState<string | null>(null);
  const recommendationProfile = recommendationProfileFromUrl(
    `${location.pathname}${location.search}`
  );

  function recordPublished(snapshot: PublishedComparisonSnapshot) {
    setPublished((current) => [snapshot, ...current.filter(({ id }) => id !== snapshot.id)]);
    setRevokedSnapshotIds((current) => withoutId(current, snapshot.id));
    setMessage("Public snapshot published. This link will keep the captured facts unchanged.");
  }

  function recordRevoked(snapshot: PublishedComparisonSnapshot) {
    setPublished((current) => current.filter(({ id }) => id !== snapshot.id));
    setRevokedSnapshotIds((current) => new Set(current).add(snapshot.id));
    setMessage("Public snapshot revoked. The old link now returns not found.");
  }

  const [handlePublish, publishing] = useSnapshotPublisher(
    products,
    recommendationProfile,
    recordPublished,
    setMessage
  );
  const [handleRevoke, revoking] = useSnapshotRevoker(recordRevoked, setMessage);

  return <SnapshotControlView
    handlePublish={handlePublish}
    handleRevoke={handleRevoke}
    message={message}
    onOpenChange={setOpen}
    open={open}
    products={products}
    published={published}
    publishing={publishing}
    revokedSnapshotIds={revokedSnapshotIds}
    revoking={revoking}
  />;
}

interface SnapshotControlViewProps {
  handlePublish: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleRevoke: (snapshot: PublishedComparisonSnapshot) => Promise<void>;
  message: string | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  products: readonly CompareProductSummary[];
  published: readonly PublishedComparisonSnapshot[];
  publishing: boolean;
  revokedSnapshotIds: ReadonlySet<string>;
  revoking: boolean;
}

function SnapshotControlView({
  handlePublish,
  handleRevoke,
  message,
  onOpenChange,
  open,
  products,
  published,
  publishing,
  revokedSnapshotIds,
  revoking
}: SnapshotControlViewProps) {
  const titleId = useId();
  const searchIndexableId = useId();

  return (
    <details
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      {...props(styles.control)}
    >
      <summary {...props(styles.summary)}>Share a fixed comparison snapshot</summary>
      <form onSubmit={handlePublish} {...props(styles.form)}>
        <label htmlFor={titleId} {...props(styles.field)}>
          Optional title
          <input id={titleId} name="title" maxLength={120} {...props(styles.input)} />
        </label>
        <label htmlFor={searchIndexableId} {...props(styles.field)}>
          <span><input id={searchIndexableId} name="searchIndexable" type="checkbox" /> Allow search engines to discover this immutable snapshot</span>
          <small>Off by default. Only snapshots with sufficient captured specifications and current offer evidence can be indexed.</small>
        </label>
        <Button disabled={publishing || products.length < 2} type="submit">{publishing ? "Publishing…" : "Publish snapshot"}</Button>
        <SnapshotHistory
          localSnapshots={published}
          onRevoke={handleRevoke}
          open={open}
          resetToken={products.map(({ id }) => id).join("|")}
          revokedSnapshotIds={revokedSnapshotIds}
          revoking={revoking}
        />
        {message ? <p role="status" {...props(styles.message)}>{message}</p> : null}
      </form>
    </details>
  );
}

function SnapshotHistory({
  localSnapshots,
  onRevoke,
  open,
  resetToken,
  revokedSnapshotIds,
  revoking
}: {
  localSnapshots: readonly PublishedComparisonSnapshot[];
  onRevoke: (snapshot: PublishedComparisonSnapshot) => Promise<void>;
  open: boolean;
  resetToken: string;
  revokedSnapshotIds: ReadonlySet<string>;
  revoking: boolean;
}) {
  if (!open) return null;

  return <ResettableErrorBoundary
    resetToken={resetToken}
    fallback={<p role="alert">Published snapshots unavailable.</p>}
  >
    <Suspense fallback={<p role="status">Loading published snapshots...</p>}>
      <PublishedSnapshots
        localSnapshots={localSnapshots}
        onRevoke={onRevoke}
        revokedSnapshotIds={revokedSnapshotIds}
        revoking={revoking}
      />
    </Suspense>
  </ResettableErrorBoundary>;
}

function useSnapshotPublisher(
  products: readonly CompareProductSummary[],
  recommendationProfile: "lowest_current_cost" | "best_value",
  onPublished: (snapshot: PublishedComparisonSnapshot) => void,
  onMessage: (message: string | null) => void
) {
  const [commitPublish, publishing] = useMutation<PublishComparisonSnapshotMutation>(publishComparisonSnapshotMutation);

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onMessage(null);
    const form = new FormData(event.currentTarget);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitPublish, {
        variables: { input: publishInput(products, recommendationProfile, form) }
      });
      const payload = response.publishComparisonSnapshot;
      const snapshot = publishedSnapshotFromPayload(payload, normalizedTitle(form));

      if (snapshot) onPublished(snapshot);
      else onMessage(routeMutationErrorMessage(payload?.errors, graphQLErrors));
    } catch {
      onMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return [handlePublish, publishing] as const;
}

function useSnapshotRevoker(
  onRevoked: (snapshot: PublishedComparisonSnapshot) => void,
  onMessage: (message: string) => void
) {
  const [commitRevoke, revoking] = useMutation<RevokeComparisonSnapshotMutation>(revokeComparisonSnapshotMutation);

  async function handleRevoke(snapshot: PublishedComparisonSnapshot) {
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitRevoke, { variables: { snapshotId: snapshot.id } });
      const payload = response.revokeComparisonSnapshot;

      if (payload?.revokedSnapshotId) onRevoked(snapshot);
      else onMessage(routeMutationErrorMessage(payload?.errors, graphQLErrors));
    } catch {
      onMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return [handleRevoke, revoking] as const;
}

function PublishedSnapshots({
  localSnapshots,
  onRevoke,
  revokedSnapshotIds,
  revoking
}: {
  localSnapshots: readonly PublishedComparisonSnapshot[];
  onRevoke: (snapshot: PublishedComparisonSnapshot) => Promise<void>;
  revokedSnapshotIds: ReadonlySet<string>;
  revoking: boolean;
}) {
  const [after, setAfter] = useState<string | null>(null);
  const [loadedSnapshots, setLoadedSnapshots] = useState<PublishedComparisonSnapshot[]>([]);
  const data = useLazyLoadQuery<OwnedComparisonSnapshotsQuery>(
    ownedComparisonSnapshotsQuery,
    { first: SNAPSHOT_PAGE_SIZE, after },
    { fetchPolicy: "store-or-network" }
  );
  const connection = data.viewer?.comparisonSnapshots;
  const pageSnapshots = useMemo(
    () => connection?.edges.map(({ node }) => snapshotFromNode(node)) ?? [],
    [connection]
  );
  const snapshots = appendUniqueSnapshots(localSnapshots, loadedSnapshots, pageSnapshots)
    .filter(({ id }) => !revokedSnapshotIds.has(id));
  const next = connection?.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;

  useEffect(() => {
    setLoadedSnapshots((current) => appendSnapshotPage(current, pageSnapshots));
  }, [pageSnapshots]);

  if (snapshots.length === 0 && !next) {
    return null;
  }

  return <>
    {snapshots.length > 0 ? (
      <ul aria-label="Published comparison snapshots" {...props(styles.list)}>
        {snapshots.map((snapshot) => (
          <li key={snapshot.id} {...props(styles.listItem)}>
            <Link to={snapshot.path}>{snapshotLabel(snapshot)}</Link>
            <Button aria-label={`Revoke public link: ${snapshotLabel(snapshot)}`} disabled={revoking} onClick={() => onRevoke(snapshot)} tone="danger" type="button" variant="soft">{revoking ? "Revoking…" : "Revoke public link"}</Button>
          </li>
        ))}
      </ul>
    ) : null}
    {next ? <Button onClick={() => setAfter(next)} type="button">Show more snapshots</Button> : null}
  </>;
}

function publishInput(
  products: readonly CompareProductSummary[],
  recommendationProfile: "lowest_current_cost" | "best_value",
  form: FormData
): PublishComparisonSnapshotMutation["variables"]["input"] {
  const title = normalizedTitle(form);

  return {
    productIds: products.map((product) => product.id),
    recommendationProfile: recommendationProfile === "best_value" ? "BEST_VALUE" : "LOWEST_CURRENT_COST",
    searchIndexable: form.get("searchIndexable") === "on",
    ...(title ? { title } : {})
  };
}

function publishedSnapshotFromPayload(
  payload: PublishComparisonSnapshotMutation["response"]["publishComparisonSnapshot"],
  title: string | null
) {
  return payload?.snapshot?.id && payload.sharePath
    ? { id: payload.snapshot.id, path: payload.sharePath, title }
    : null;
}

function snapshotFromNode(node: OwnedSnapshotNode): PublishedComparisonSnapshot {
  return { id: node.id, path: node.sharePath, title: node.title ?? null };
}

function appendUniqueSnapshots(
  ...groups: ReadonlyArray<readonly PublishedComparisonSnapshot[]>
) {
  const snapshots: PublishedComparisonSnapshot[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const snapshot of group) {
      if (!seen.has(snapshot.id)) {
        seen.add(snapshot.id);
        snapshots.push(snapshot);
      }
    }
  }

  return snapshots;
}

function appendSnapshotPage(
  current: PublishedComparisonSnapshot[],
  page: readonly PublishedComparisonSnapshot[]
) {
  const seen = new Set(current.map(({ id }) => id));
  const additions = page.filter(({ id }) => !seen.has(id));
  return additions.length ? [...current, ...additions] : current;
}

function withoutId(ids: ReadonlySet<string>, id: string) {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

function normalizedTitle(form: FormData) {
  const title = String(form.get("title") ?? "").trim();
  return title || null;
}

function snapshotLabel(snapshot: PublishedComparisonSnapshot) {
  return snapshot.title || "Open public snapshot";
}
