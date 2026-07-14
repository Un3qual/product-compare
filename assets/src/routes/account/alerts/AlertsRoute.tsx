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
import { commitRouteMutationPromise } from "../../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE, routeMutationErrorMessage } from "../../route-errors";
import deletePriceWatchMutation from "./queries/DeletePriceWatchMutation";
import markAlertReadMutation from "./queries/MarkAlertReadMutation";
import updatePriceWatchMutation from "./queries/UpdatePriceWatchMutation";
import { alertsLoader, type AlertSummary, type WatchSummary } from "./loader";

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
  const loaderData = useLoaderData<typeof alertsLoader>();

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
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [commitMarkRead] = useMutation<MarkAlertReadMutation>(markAlertReadMutation);
  const [commitUpdate] = useMutation<UpdatePriceWatchMutation>(updatePriceWatchMutation);
  const [commitDelete] = useMutation<DeletePriceWatchMutation>(deletePriceWatchMutation);

  async function run(id: string, operation: () => Promise<string | null>) {
    setPendingIds((current) => new Set(current).add(id));
    setError(null);
    try {
      const operationError = await operation();
      if (operationError) setError(operationError);
      else await revalidator.revalidate();
    } catch {
      setError(DEFAULT_ROUTE_ERROR_MESSAGE);
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <PageShell eyebrow="Account" title="Price alerts" description="Changes are recorded only from fresh, in-stock offers with complete landed prices.">
      <div {...props(styles.workspace)}>
        {error ? <FeedbackState kind="error" title={error} /> : null}
        <section aria-labelledby="alert-events-title" {...props(styles.section)}>
          <h2 id="alert-events-title" {...props(styles.sectionTitle)}>Recent changes</h2>
          {alerts.length === 0 ? <p {...props(styles.aside)}>No qualifying price or availability changes yet.</p> : (
            <ol aria-label="Price alert events" {...props(styles.list)}>
              {alerts.map((alert) => (
                <li key={alert.id} {...props(styles.item, alert.readAt ? null : styles.unread)}>
                  <strong><Link to={`/products/${encodeURIComponent(alert.productSlug)}`}>{alert.productName}</Link></strong>
                  <p {...props(styles.meta)}>
                    <span>{ruleLabel(alert.ruleType)}</span>
                    <span>{alert.landedPrice} {alert.currency} landed</span>
                    <span>{alert.merchantName}</span>
                    <time dateTime={alert.observedAt}>{dateLabel(alert.observedAt)}</time>
                  </p>
                  {!alert.readAt ? (
                    <div {...props(styles.actions)}>
                      <Button disabled={pendingIds.has(alert.id)} variant="soft" onClick={() => void run(alert.id, async () => {
                        const { response, graphQLErrors } = await commitRouteMutationPromise(commitMarkRead, { variables: { id: alert.id } });
                        return response.markAlertRead?.event ? null : routeMutationErrorMessage(response.markAlertRead?.errors, graphQLErrors);
                      })}>Mark read</Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
          {hasMoreAlerts ? <p {...props(styles.aside)}>Showing the 50 most recent events.</p> : null}
        </section>
        <section aria-labelledby="active-watches-title" {...props(styles.section)}>
          <h2 id="active-watches-title" {...props(styles.sectionTitle)}>Active watches</h2>
          {watches.length === 0 ? <p {...props(styles.aside)}>Create a watch from any product detail page.</p> : (
            <ul aria-label="Active price watches" {...props(styles.list)}>
              {watches.map((watch) => (
                <li key={watch.id} {...props(styles.item)}>
                  <strong><Link to={`/products/${encodeURIComponent(watch.productSlug)}`}>{watch.productName}</Link></strong>
                  <p {...props(styles.meta)}><span>{watchLabel(watch)}</span>{watch.merchantName ? <span>{watch.merchantName}</span> : null}</p>
                  <div {...props(styles.actions)}>
                    <Button disabled={pendingIds.has(watch.id)} variant="soft" onClick={() => void run(watch.id, async () => {
                      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, { variables: { input: { id: watch.id, enabled: false } } });
                      return response.updatePriceWatch?.watch ? null : routeMutationErrorMessage(response.updatePriceWatch?.errors, graphQLErrors);
                    })}>Pause</Button>
                    <Button disabled={pendingIds.has(watch.id)} tone="danger" variant="ghost" onClick={() => void run(watch.id, async () => {
                      const { response, graphQLErrors } = await commitRouteMutationPromise(commitDelete, { variables: { id: watch.id } });
                      return response.deletePriceWatch?.deletedWatchId ? null : routeMutationErrorMessage(response.deletePriceWatch?.errors, graphQLErrors);
                    })}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {hasMoreWatches ? <p {...props(styles.aside)}>Showing the 50 newest active watches.</p> : null}
        </section>
      </div>
    </PageShell>
  );
}

function ruleLabel(ruleType: string) {
  return ({ TARGET_PRICE: "Target reached", PERCENTAGE_DROP: "Price drop reached", BACK_IN_STOCK: "Back in stock", NEWLY_AVAILABLE: "Newly available" } as Record<string, string>)[ruleType] ?? "Watch matched";
}

function watchLabel(watch: WatchSummary) {
  if (watch.ruleType === "TARGET_PRICE") return `Target ${watch.targetAmount ?? "—"} ${watch.currency}`;
  if (watch.ruleType === "PERCENTAGE_DROP") return `${watch.percentageDrop ?? "—"}% below ${watch.baselineLandedPrice ?? "baseline"} ${watch.currency}`;
  return ruleLabel(watch.ruleType);
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toISOString().slice(0, 10);
}
