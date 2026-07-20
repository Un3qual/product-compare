import { useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData, useRevalidator } from "react-router-dom";
import { useMutation } from "react-relay";
import type { DeletePriceWatchMutation } from "../../../__generated__/DeletePriceWatchMutation.graphql";
import type { MarkAlertReadMutation } from "../../../__generated__/MarkAlertReadMutation.graphql";
import type { UpdatePriceWatchMutation } from "../../../__generated__/UpdatePriceWatchMutation.graphql";
import { FeedbackState } from "../../../ui/components/feedback/FeedbackState";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { Button } from "../../../ui/primitives/Button";
import { productDetailPath } from "../../products/product-detail-route-data";
import { commitRouteMutationPromise } from "../../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../route-errors";
import {
  resolveDeletePriceWatchMutationError,
  resolveMarkAlertReadMutationError,
  resolveTogglePriceWatchMutationError
} from "./alerts-mutation-data";
import deletePriceWatchMutation from "./queries/DeletePriceWatchMutation";
import markAlertReadMutation from "./queries/MarkAlertReadMutation";
import updatePriceWatchMutation from "./queries/UpdatePriceWatchMutation";
import type { AlertsRouteLoaderData, AlertSummary, WatchSummary } from "./loader";
import {
  alertRuleLabel,
  buildAlertsViewData,
  observationDateLabel,
  priceWatchToggleControl,
  priceWatchLabel
} from "./alerts-view-data";

const styles = create({
  actions: { display: "flex", flexWrap: "wrap", gap: "0.6rem" },
  aside: { color: "var(--pc-text-secondary)", margin: 0 },
  item: {
    borderBlockStart: "1px solid var(--pc-border-quiet)",
    display: "grid",
    gap: "0.65rem",
    paddingBlock: "1rem"
  },
  list: { listStyle: "none", margin: 0, padding: 0 },
  meta: { color: "var(--pc-text-secondary)", display: "flex", flexWrap: "wrap", gap: "0.4rem 1rem", margin: 0 },
  section: { display: "grid", gap: "0.8rem" },
  sectionTitle: { fontSize: "1.35rem", letterSpacing: "-0.02em", margin: 0 },
  unread: { borderInlineStart: "3px solid var(--pc-accent-solid)", paddingInlineStart: "0.85rem" },
  workspace: { display: "grid", gap: "2.5rem" }
});

export function AlertsRoute() {
  const loaderData = useLoaderData() as AlertsRouteLoaderData;

  if (loaderData.status === "unauthorized") {
    return (
      <PageShell title="Price alerts" width="reading">
        <FeedbackState kind="empty" title="Sign in to manage price alerts." />
        <p><Link to="/auth/login">Sign in</Link></p>
      </PageShell>
    );
  }

  return <AlertsWorkspace alerts={loaderData.alerts} watches={loaderData.watches} hasMoreAlerts={loaderData.hasMoreAlerts} hasMoreWatches={loaderData.hasMoreWatches} />;
}

function AlertsWorkspace({ alerts, watches, hasMoreAlerts, hasMoreWatches }: { alerts: AlertSummary[]; watches: WatchSummary[]; hasMoreAlerts: boolean; hasMoreWatches: boolean }) {
  const revalidator = useRevalidator();
  const [errorsById, setErrorsById] = useState<ReadonlyMap<string, string>>(() => new Map());
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [commitMarkRead] = useMutation<MarkAlertReadMutation>(markAlertReadMutation);
  const [commitUpdate] = useMutation<UpdatePriceWatchMutation>(updatePriceWatchMutation);
  const [commitDelete] = useMutation<DeletePriceWatchMutation>(deletePriceWatchMutation);
  const viewData = buildAlertsViewData(alerts, watches);

  async function run(id: string, operation: () => Promise<string | null>) {
    setPendingIds((current) => new Set(current).add(id));
    setErrorsById((current) => withoutKey(current, id));
    try {
      const operationError = await operation();
      if (operationError) setErrorsById((current) => withError(current, id, operationError));
      else await revalidator.revalidate();
    } catch {
      setErrorsById((current) => withError(current, id, DEFAULT_ROUTE_ERROR_MESSAGE));
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  function toggleWatch(watch: WatchSummary) {
    const control = priceWatchToggleControl(watch);
    return run(watch.id, async () => {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, {
        variables: { input: { id: watch.id, enabled: control.nextEnabled } }
      });
      return resolveTogglePriceWatchMutationError(response.updatePriceWatch, graphQLErrors);
    });
  }

  function deleteWatch(watch: WatchSummary) {
    return run(watch.id, async () => {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitDelete, {
        variables: { id: watch.id }
      });
      return resolveDeletePriceWatchMutationError(response.deletePriceWatch, graphQLErrors);
    });
  }

  return (
    <PageShell eyebrow="Account" title="Price alerts" description="Changes are recorded only from fresh, in-stock offers with complete landed prices.">
      <div {...props(styles.workspace)}>
        <section aria-labelledby="alert-events-title" {...props(styles.section)}>
          <h2 id="alert-events-title" {...props(styles.sectionTitle)}>Recent changes</h2>
          {viewData.alerts.length === 0 ? <p {...props(styles.aside)}>No qualifying price or availability changes yet.</p> : (
            <ol aria-label="Price alert events" {...props(styles.list)}>
              {viewData.alerts.map((alert) => {
                const alertError = errorsById.get(alert.id);

                return <li key={alert.id} {...props(styles.item, alert.readAt ? null : styles.unread)}>
                  <strong><Link to={productDetailPath(alert.productSlug)}>{alert.productName}</Link></strong>
                  <p {...props(styles.meta)}>
                    <span>{alertRuleLabel(alert.ruleType)}</span>
                    <span>{alert.landedPrice} {alert.currency} landed</span>
                    <span>{alert.merchantName}</span>
                    <time dateTime={alert.observedAt}>{observationDateLabel(alert.observedAt)}</time>
                  </p>
                  {alertError ? <FeedbackState kind="error" title={alertError} /> : null}
                  {!alert.readAt ? (
                    <div {...props(styles.actions)}>
                      <Button disabled={pendingIds.has(alert.id)} variant="soft" onClick={() => { run(alert.id, async () => {
                        const { response, graphQLErrors } = await commitRouteMutationPromise(commitMarkRead, {
                          variables: { id: alert.id }
                        });
                        return resolveMarkAlertReadMutationError(response.markAlertRead, graphQLErrors);
                      }); }}>Mark read</Button>
                    </div>
                  ) : null}
                </li>;
              })}
            </ol>
          )}
          {hasMoreAlerts ? <p {...props(styles.aside)}>Showing the 50 most recent events.</p> : null}
        </section>
        <section aria-labelledby="active-watches-title" {...props(styles.section)}>
          <h2 id="active-watches-title" {...props(styles.sectionTitle)}>Active watches</h2>
          {viewData.activeWatches.length === 0 ? <p {...props(styles.aside)}>Create a watch from any product detail page, or resume one below.</p> : (
            <WatchList ariaLabel="Active price watches" watches={viewData.activeWatches} errorsById={errorsById} pendingIds={pendingIds} onDelete={deleteWatch} onToggle={toggleWatch} />
          )}
          {hasMoreWatches ? <p {...props(styles.aside)}>Showing the 50 newest watches.</p> : null}
        </section>
        {viewData.pausedWatches.length > 0 ? (
          <section aria-labelledby="paused-watches-title" {...props(styles.section)}>
            <h2 id="paused-watches-title" {...props(styles.sectionTitle)}>Paused watches</h2>
            <WatchList ariaLabel="Paused price watches" watches={viewData.pausedWatches} errorsById={errorsById} pendingIds={pendingIds} onDelete={deleteWatch} onToggle={toggleWatch} />
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}

function WatchList({
  ariaLabel,
  errorsById,
  watches,
  pendingIds,
  onDelete,
  onToggle
}: {
  ariaLabel: string;
  errorsById: ReadonlyMap<string, string>;
  watches: readonly WatchSummary[];
  pendingIds: ReadonlySet<string>;
  onDelete: (watch: WatchSummary) => Promise<void>;
  onToggle: (watch: WatchSummary) => Promise<void>;
}) {
  return (
    <ul aria-label={ariaLabel} {...props(styles.list)}>
      {watches.map((watch) => (
        <WatchListItem key={watch.id} error={errorsById.get(watch.id) ?? null} pendingIds={pendingIds} watch={watch} onDelete={onDelete} onToggle={onToggle} />
      ))}
    </ul>
  );
}

function WatchListItem({
  error,
  pendingIds,
  watch,
  onDelete,
  onToggle
}: {
  error: string | null;
  pendingIds: ReadonlySet<string>;
  watch: WatchSummary;
  onDelete: (watch: WatchSummary) => Promise<void>;
  onToggle: (watch: WatchSummary) => Promise<void>;
}) {
  const control = priceWatchToggleControl(watch);

  return (
    <li {...props(styles.item)}>
      <strong><Link to={productDetailPath(watch.productSlug)}>{watch.productName}</Link></strong>
      <p {...props(styles.meta)}><span>{priceWatchLabel(watch)}</span>{watch.merchantName ? <span>{watch.merchantName}</span> : null}</p>
      {error ? <FeedbackState kind="error" title={error} /> : null}
      <div {...props(styles.actions)}>
        <Button disabled={pendingIds.has(watch.id)} variant="soft" onClick={() => onToggle(watch)}>{control.label}</Button>
        <Button disabled={pendingIds.has(watch.id)} tone="danger" variant="ghost" onClick={() => onDelete(watch)}>Delete</Button>
      </div>
    </li>
  );
}

function withError(current: ReadonlyMap<string, string>, id: string, error: string) {
  const next = new Map(current);
  next.set(id, error);
  return next;
}

function withoutKey(current: ReadonlyMap<string, string>, id: string) {
  if (!current.has(id)) return current;
  const next = new Map(current);
  next.delete(id);
  return next;
}
