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
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../route-errors";
import type { CompareProductSummary } from "./loader";
import {
  recommendationProfileFromUrl,
  type RecommendationProfile
} from "./recommendation-route-data";
import ownedComparisonSnapshotsQuery from "./queries/OwnedComparisonSnapshotsQuery";
import publishComparisonSnapshotMutation from "./queries/PublishComparisonSnapshotMutation";
import revokeComparisonSnapshotMutation from "./queries/RevokeComparisonSnapshotMutation";
import {
  appendComparisonSnapshotPage,
  buildComparisonSnapshotPublishInput,
  comparisonSnapshotLabel,
  mergeComparisonSnapshots,
  nextComparisonSnapshotCursor,
  publishComparisonSnapshotState,
  revokeComparisonSnapshotState,
  resolvePublishComparisonSnapshotMutationOutcome,
  resolveRevokeComparisonSnapshotMutationOutcome,
  snapshotFromNode,
  type ComparisonSnapshotState,
  type PublishedComparisonSnapshot
} from "./share-comparison-data";

const SNAPSHOT_PAGE_SIZE = 20;

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
  const [snapshotState, setSnapshotState] = useState<ComparisonSnapshotState>(() => ({
    message: null,
    published: [],
    revokedSnapshotIds: new Set()
  }));
  const recommendationProfile = recommendationProfileFromUrl(
    `${location.pathname}${location.search}`
  );

  function recordPublished(snapshot: PublishedComparisonSnapshot) {
    setSnapshotState((current) => publishComparisonSnapshotState(current, snapshot));
  }

  function recordRevoked(snapshot: PublishedComparisonSnapshot) {
    setSnapshotState((current) => revokeComparisonSnapshotState(current, snapshot));
  }

  function recordMessage(message: string | null) {
    setSnapshotState((current) => ({ ...current, message }));
  }

  const [handlePublish, publishing] = useSnapshotPublisher(
    products,
    recommendationProfile,
    recordPublished,
    recordMessage
  );
  const [handleRevoke, revoking] = useSnapshotRevoker(recordRevoked, recordMessage);

  return <SnapshotControlView
    handlePublish={handlePublish}
    handleRevoke={handleRevoke}
    message={snapshotState.message}
    onOpenChange={setOpen}
    open={open}
    products={products}
    published={snapshotState.published}
    publishing={publishing}
    revokedSnapshotIds={snapshotState.revokedSnapshotIds}
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
  recommendationProfile: RecommendationProfile,
  onPublished: (snapshot: PublishedComparisonSnapshot) => void,
  onMessage: (message: string | null) => void
) {
  const [commitPublish, publishing] = useMutation<PublishComparisonSnapshotMutation>(publishComparisonSnapshotMutation);

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onMessage(null);
    const form = new FormData(event.currentTarget);
    const input = buildComparisonSnapshotPublishInput({
      productIds: products.map(({ id }) => id),
      recommendationProfile,
      searchIndexable: form.get("searchIndexable") === "on",
      title: form.get("title")
    });

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitPublish, {
        variables: { input }
      });
      const payload = response.publishComparisonSnapshot;
      const outcome = resolvePublishComparisonSnapshotMutationOutcome(
        payload,
        input.title ?? null,
        graphQLErrors
      );

      if (outcome.error === null) onPublished(outcome.snapshot);
      else onMessage(outcome.error);
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
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitRevoke, {
        variables: { snapshotId: snapshot.id }
      });
      const payload = response.revokeComparisonSnapshot;
      const outcome = resolveRevokeComparisonSnapshotMutationOutcome(
        payload,
        snapshot,
        graphQLErrors
      );

      if (outcome.error === null) onRevoked(outcome.snapshot);
      else onMessage(outcome.error);
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
  const snapshots = mergeComparisonSnapshots(
    [localSnapshots, loadedSnapshots, pageSnapshots],
    revokedSnapshotIds
  );
  const next = nextComparisonSnapshotCursor(connection, after);

  useEffect(() => {
    setLoadedSnapshots((current) => appendComparisonSnapshotPage(current, pageSnapshots));
  }, [pageSnapshots]);

  if (snapshots.length === 0 && !next) {
    return null;
  }

  return <>
    {snapshots.length > 0 ? (
      <ul aria-label="Published comparison snapshots" {...props(styles.list)}>
        {snapshots.map((snapshot) => (
          <li key={snapshot.id} {...props(styles.listItem)}>
            <Link to={snapshot.path}>{comparisonSnapshotLabel(snapshot)}</Link>
            <Button aria-label={`Revoke public link: ${comparisonSnapshotLabel(snapshot)}`} disabled={revoking} onClick={() => onRevoke(snapshot)} tone="danger" type="button" variant="soft">{revoking ? "Revoking…" : "Revoke public link"}</Button>
          </li>
        ))}
      </ul>
    ) : null}
    {next ? <Button onClick={() => setAfter(next)} type="button">Show more snapshots</Button> : null}
  </>;
}
