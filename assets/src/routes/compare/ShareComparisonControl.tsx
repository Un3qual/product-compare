import { Suspense, type FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLocation } from "react-router-dom";
import { useLazyLoadQuery, useMutation } from "react-relay";
import type { ComparisonSharingOperationsPublishComparisonSnapshotMutation } from "../../__generated__/ComparisonSharingOperationsPublishComparisonSnapshotMutation.graphql";
import type { ComparisonSharingOperationsQuery } from "../../__generated__/ComparisonSharingOperationsQuery.graphql";
import type { ComparisonSharingOperationsRevokeComparisonSnapshotMutation } from "../../__generated__/ComparisonSharingOperationsRevokeComparisonSnapshotMutation.graphql";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { Button } from "../../ui/primitives/Button";
import { Checkbox } from "../../ui/primitives/Checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/primitives/Collapsible";
import { TextField } from "../../ui/primitives/TextField";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../route-errors";
import type { CompareProductSummary } from "./loader";
import {
  comparisonSharingOperationsQuery,
  publishComparisonSnapshotMutation,
  revokeComparisonSnapshotMutation,
} from "./ComparisonSharingOperations";
import {
  recommendationProfileFromUrl,
  type RecommendationProfile,
} from "./recommendation-route-data";
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
  snapshotRevocationCanStart,
  snapshotRevocationRowState,
  snapshotFromNode,
  type ComparisonSnapshotState,
  type PublishedComparisonSnapshot,
} from "./share-comparison-data";

const SNAPSHOT_PAGE_SIZE = 20;

const styles = create({
  content: {
    display: {
      default: "block",
      ":where([data-state='closed'])": "none",
    },
  },
  control: { borderBlockStart: "1px solid var(--pc-border-quiet)", paddingBlockStart: "0.85rem" },
  field: { display: "grid", gap: "0.35rem" },
  form: { display: "grid", gap: "0.75rem", paddingBlockStart: "0.8rem" },
  input: {
    backgroundColor: "var(--pc-surface)",
    border: "1px solid var(--pc-border-emphasized)",
    borderRadius: "0.4rem",
    color: "var(--pc-text)",
    minHeight: "2.6rem",
    paddingInline: "0.7rem",
  },
  list: { display: "grid", gap: "0.65rem", listStyle: "none", margin: 0, padding: 0 },
  listItem: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
    justifyContent: "space-between",
  },
  message: { color: "var(--pc-text-secondary)", margin: 0 },
  summary: {
    appearance: "none",
    backgroundColor: "transparent",
    border: 0,
    color: "inherit",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: 650,
    lineHeight: "inherit",
    padding: 0,
    textAlign: "start",
  },
});

export function ShareComparisonControl({
  products,
}: {
  products: readonly CompareProductSummary[];
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [snapshotState, setSnapshotState] = useState<ComparisonSnapshotState>(() => ({
    message: null,
    published: [],
    revokedSnapshotIds: new Set(),
  }));
  const recommendationProfile = recommendationProfileFromUrl(
    `${location.pathname}${location.search}`,
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
    recordMessage,
  );
  const { errorsBySnapshotId, handleRevoke, pendingSnapshotIds } =
    useSnapshotRevoker(recordRevoked);

  return (
    <SnapshotControlView
      handlePublish={handlePublish}
      handleRevoke={handleRevoke}
      message={snapshotState.message}
      onOpenChange={setOpen}
      open={open}
      products={products}
      published={snapshotState.published}
      publishing={publishing}
      revokedSnapshotIds={snapshotState.revokedSnapshotIds}
      revocationErrorsBySnapshotId={errorsBySnapshotId}
      revokingSnapshotIds={pendingSnapshotIds}
    />
  );
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
  revocationErrorsBySnapshotId: ReadonlyMap<string, string>;
  revokingSnapshotIds: ReadonlySet<string>;
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
  revocationErrorsBySnapshotId,
  revokingSnapshotIds,
}: SnapshotControlViewProps) {
  const titleId = useId();
  const searchIndexableId = useId();

  return (
    <Collapsible onOpenChange={onOpenChange} open={open} {...props(styles.control)}>
      <CollapsibleTrigger {...props(styles.summary)}>
        Share a fixed comparison snapshot
      </CollapsibleTrigger>
      <CollapsibleContent forceMount {...props(styles.content)}>
        <form onSubmit={handlePublish} {...props(styles.form)}>
          <label htmlFor={titleId} {...props(styles.field)}>
            Optional title
            <TextField id={titleId} name="title" maxLength={120} {...props(styles.input)} />
          </label>
          <label htmlFor={searchIndexableId} {...props(styles.field)}>
            <span>
              <Checkbox id={searchIndexableId} name="searchIndexable" /> Allow search engines to
              discover this immutable snapshot
            </span>
            <small>
              Off by default. Only snapshots with sufficient captured specifications and current
              offer evidence can be indexed.
            </small>
          </label>
          <Button disabled={publishing || products.length < 2} type="submit">
            {publishing ? "Publishing…" : "Publish snapshot"}
          </Button>
          <SnapshotHistory
            localSnapshots={published}
            onRevoke={handleRevoke}
            open={open}
            resetToken={products.map(({ id }) => id).join("|")}
            revokedSnapshotIds={revokedSnapshotIds}
            revocationErrorsBySnapshotId={revocationErrorsBySnapshotId}
            revokingSnapshotIds={revokingSnapshotIds}
          />
          {message ? (
            <p role="status" {...props(styles.message)}>
              {message}
            </p>
          ) : null}
        </form>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SnapshotHistory({
  localSnapshots,
  onRevoke,
  open,
  resetToken,
  revokedSnapshotIds,
  revocationErrorsBySnapshotId,
  revokingSnapshotIds,
}: {
  localSnapshots: readonly PublishedComparisonSnapshot[];
  onRevoke: (snapshot: PublishedComparisonSnapshot) => Promise<void>;
  open: boolean;
  resetToken: string;
  revokedSnapshotIds: ReadonlySet<string>;
  revocationErrorsBySnapshotId: ReadonlyMap<string, string>;
  revokingSnapshotIds: ReadonlySet<string>;
}) {
  if (!open) return null;

  return (
    <ResettableErrorBoundary
      resetToken={resetToken}
      fallback={<p role="alert">Published snapshots unavailable.</p>}
    >
      <Suspense fallback={<p role="status">Loading published snapshots...</p>}>
        <PublishedSnapshots
          localSnapshots={localSnapshots}
          onRevoke={onRevoke}
          revokedSnapshotIds={revokedSnapshotIds}
          revocationErrorsBySnapshotId={revocationErrorsBySnapshotId}
          revokingSnapshotIds={revokingSnapshotIds}
        />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function useSnapshotPublisher(
  products: readonly CompareProductSummary[],
  recommendationProfile: RecommendationProfile,
  onPublished: (snapshot: PublishedComparisonSnapshot) => void,
  onMessage: (message: string | null) => void,
) {
  const [commitPublish, publishing] =
    useMutation<ComparisonSharingOperationsPublishComparisonSnapshotMutation>(
      publishComparisonSnapshotMutation,
    );

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onMessage(null);
    const form = new FormData(event.currentTarget);
    const input = buildComparisonSnapshotPublishInput({
      productIds: products.map(({ id }) => id),
      recommendationProfile,
      searchIndexable: form.get("searchIndexable") === "on",
      title: form.get("title"),
    });

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitPublish, {
        variables: { input },
      });
      const payload = response.publishComparisonSnapshot;
      const outcome = resolvePublishComparisonSnapshotMutationOutcome(
        payload,
        input.title ?? null,
        graphQLErrors,
      );

      if (outcome.error === null) onPublished(outcome.snapshot);
      else onMessage(outcome.error);
    } catch {
      onMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return [handlePublish, publishing] as const;
}

function useSnapshotRevoker(onRevoked: (snapshot: PublishedComparisonSnapshot) => void) {
  const [commitRevoke] = useMutation<ComparisonSharingOperationsRevokeComparisonSnapshotMutation>(
    revokeComparisonSnapshotMutation,
  );
  const pendingSnapshotIdsRef = useRef<ReadonlySet<string>>(new Set());
  const [pendingSnapshotIds, setPendingSnapshotIds] = useState<ReadonlySet<string>>(
    pendingSnapshotIdsRef.current,
  );
  const [errorsBySnapshotId, setErrorsBySnapshotId] = useState<ReadonlyMap<string, string>>(
    new Map(),
  );

  async function handleRevoke(snapshot: PublishedComparisonSnapshot) {
    if (!snapshotRevocationCanStart(pendingSnapshotIdsRef.current, snapshot.id)) {
      return;
    }

    const pending = new Set(pendingSnapshotIdsRef.current).add(snapshot.id);
    pendingSnapshotIdsRef.current = pending;
    setPendingSnapshotIds(pending);
    setErrorsBySnapshotId((current) => withoutSnapshotError(current, snapshot.id));

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitRevoke, {
        variables: { snapshotId: snapshot.id },
      });
      const payload = response.revokeComparisonSnapshot;
      const outcome = resolveRevokeComparisonSnapshotMutationOutcome(
        payload,
        snapshot,
        graphQLErrors,
      );

      if (outcome.error === null) {
        onRevoked(outcome.snapshot);
      } else {
        setErrorsBySnapshotId((current) => withSnapshotError(current, snapshot.id, outcome.error));
      }
    } catch {
      setErrorsBySnapshotId((current) =>
        withSnapshotError(current, snapshot.id, DEFAULT_ROUTE_ERROR_MESSAGE),
      );
    } finally {
      const remaining = new Set(pendingSnapshotIdsRef.current);
      remaining.delete(snapshot.id);
      pendingSnapshotIdsRef.current = remaining;
      setPendingSnapshotIds(remaining);
    }
  }

  return { errorsBySnapshotId, handleRevoke, pendingSnapshotIds };
}

function PublishedSnapshots({
  localSnapshots,
  onRevoke,
  revokedSnapshotIds,
  revocationErrorsBySnapshotId,
  revokingSnapshotIds,
}: {
  localSnapshots: readonly PublishedComparisonSnapshot[];
  onRevoke: (snapshot: PublishedComparisonSnapshot) => Promise<void>;
  revokedSnapshotIds: ReadonlySet<string>;
  revocationErrorsBySnapshotId: ReadonlyMap<string, string>;
  revokingSnapshotIds: ReadonlySet<string>;
}) {
  const [after, setAfter] = useState<string | null>(null);
  const [loadedSnapshots, setLoadedSnapshots] = useState<PublishedComparisonSnapshot[]>([]);
  const data = useLazyLoadQuery<ComparisonSharingOperationsQuery>(
    comparisonSharingOperationsQuery,
    { first: SNAPSHOT_PAGE_SIZE, after },
    { fetchPolicy: "store-or-network" },
  );
  const connection = data.viewer?.comparisonSnapshots;
  const pageSnapshots = useMemo(
    () => connection?.edges.map(({ node }) => snapshotFromNode(node)) ?? [],
    [connection],
  );
  const snapshots = mergeComparisonSnapshots(
    [localSnapshots, loadedSnapshots, pageSnapshots],
    revokedSnapshotIds,
  );
  const next = nextComparisonSnapshotCursor(connection, after);

  useEffect(() => {
    setLoadedSnapshots((current) => appendComparisonSnapshotPage(current, pageSnapshots));
  }, [pageSnapshots]);

  if (snapshots.length === 0 && !next) {
    return null;
  }

  return (
    <>
      {snapshots.length > 0 ? (
        <ul aria-label="Published comparison snapshots" {...props(styles.list)}>
          {snapshots.map((snapshot) => {
            const revocation = snapshotRevocationRowState(
              snapshot.id,
              revokingSnapshotIds,
              revocationErrorsBySnapshotId,
            );

            return (
              <li key={snapshot.id} {...props(styles.listItem)}>
                <Link to={snapshot.path}>{comparisonSnapshotLabel(snapshot)}</Link>
                <Button
                  aria-label={`Revoke public link: ${comparisonSnapshotLabel(snapshot)}`}
                  disabled={revocation.disabled}
                  onClick={() => onRevoke(snapshot)}
                  tone="danger"
                  type="button"
                  variant="soft"
                >
                  {revocation.buttonCopy}
                </Button>
                {revocation.error ? <p role="alert">{revocation.error}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {next ? (
        <Button onClick={() => setAfter(next)} type="button">
          Show more snapshots
        </Button>
      ) : null}
    </>
  );
}

function withoutSnapshotError(errorsBySnapshotId: ReadonlyMap<string, string>, snapshotId: string) {
  if (!errorsBySnapshotId.has(snapshotId)) {
    return errorsBySnapshotId;
  }

  const next = new Map(errorsBySnapshotId);
  next.delete(snapshotId);
  return next;
}

function withSnapshotError(
  errorsBySnapshotId: ReadonlyMap<string, string>,
  snapshotId: string,
  error: string,
) {
  const next = new Map(errorsBySnapshotId);
  next.set(snapshotId, error);
  return next;
}
