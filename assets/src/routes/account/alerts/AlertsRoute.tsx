import { useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData, useRevalidator } from "react-router";
import { graphql, useFragment, useMutation, usePreloadedQuery } from "react-relay";
import type { AlertOperationsDeletePriceWatchMutation } from "$generated/AlertOperationsDeletePriceWatchMutation.graphql";
import type { AlertOperationsMarkAlertReadMutation } from "$generated/AlertOperationsMarkAlertReadMutation.graphql";
import type { AlertOperationsUpdatePriceWatchMutation } from "$generated/AlertOperationsUpdatePriceWatchMutation.graphql";
import type {
  AlertsRoute_alert$data,
  AlertsRoute_alert$key,
} from "$generated/AlertsRoute_alert.graphql";
import type {
  AlertsRoute_watch$data,
  AlertsRoute_watch$key,
} from "$generated/AlertsRoute_watch.graphql";
import type { AlertsRouteQuery } from "$generated/AlertsRouteQuery.graphql";
import type { Route } from "./+types/AlertsRoute";
import { staticRouteMetaDescriptors } from "$frontend/seo";
import { RouteErrorBoundary as SharedRouteErrorBoundary } from "$routes/compare/RouteErrorBoundary";
import { graphQLResponseHasErrorCode, RouteLoaderGraphQLError } from "$relay/environment";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { PageShell } from "$ui/components/layout/PageShell";
import { DestructiveActionDialog } from "$ui/components/overlays/DestructiveActionDialog";
import { Button } from "$ui/primitives/Button";
import { productDetailPath } from "../../products/product-detail-route-data";

export { AlertsRoute as default, alertsLoader as clientLoader, alertsLoader as loader };

export function meta() {
  return staticRouteMetaDescriptors({
    title: "Price alerts",
    description:
      "Manage product price watches and review qualifying price or availability changes.",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <SharedRouteErrorBoundary error={error} resourceName="price alerts" title="Price alerts" />
  );
}
import { commitRouteMutationPromise } from "$relay/mutations";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "$relay/mutation-errors";
import { resolveMarkAlertReadMutationError } from "./alert-rows/alert-event-mutation-result";
import { alertRuleLabel, observationDateLabel } from "./alert-rows/alert-event-view";
import {
  resolveDeletePriceWatchMutationError,
  resolveTogglePriceWatchMutationError,
} from "./watches/price-watch-mutation-results";
import {
  deletePriceWatchMutation,
  markAlertReadMutation,
  updatePriceWatchMutation,
} from "./AlertOperations";
import {
  buildAlertsViewData,
  priceWatchToggleControl,
  priceWatchLabel,
} from "./watches/price-watch-view";

const alertsRouteQuery = graphql`
  query AlertsRouteQuery($first: Int!) {
    myAlertEvents(first: $first) {
      edges {
        node {
          id
          readAt
          ...AlertsRoute_alert
        }
      }
      pageInfo {
        hasNextPage
      }
    }
    myPriceWatches(first: $first) {
      edges {
        node {
          id
          enabled
          ...AlertsRoute_watch
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const alertFragment = graphql`
  fragment AlertsRoute_alert on AlertEvent {
    id
    productName
    productSlug
    merchantName
    ruleType
    currency
    landedPrice
    observedAt
    readAt
  }
`;

const watchFragment = graphql`
  fragment AlertsRoute_watch on PriceWatch {
    id
    productName
    productSlug
    merchantName
    ruleType
    currency
    targetAmount
    percentageDrop
    baselineLandedPrice
    enabled
  }
`;

type AlertSummary = Omit<AlertsRoute_alert$data, " $fragmentType">;
type WatchSummary = Omit<AlertsRoute_watch$data, " $fragmentType">;
type AlertItemRef = AlertsRoute_alert$key & { readonly id: string };
type WatchItemRef = AlertsRoute_watch$key & { readonly enabled: boolean; readonly id: string };

const AUTH_CODES = new Set(["UNAUTHENTICATED"]);

const styles = create({
  actions: { display: "flex", flexWrap: "wrap", gap: "0.6rem" },
  aside: { color: "var(--pc-text-secondary)", margin: 0 },
  item: {
    borderBlockStart: "1px solid var(--pc-border-quiet)",
    display: "grid",
    gap: "0.65rem",
    paddingBlock: "1rem",
  },
  list: { listStyle: "none", margin: 0, padding: 0 },
  meta: {
    color: "var(--pc-text-secondary)",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem 1rem",
    margin: 0,
  },
  section: { display: "grid", gap: "0.8rem" },
  sectionTitle: { fontSize: "1.35rem", letterSpacing: "-0.02em", margin: 0 },
  unread: { borderInlineStart: "3px solid var(--pc-accent-solid)", paddingInlineStart: "0.85rem" },
  workspace: { display: "grid", gap: "2.5rem" },
});

export function AlertsRoute() {
  const loaderData = useLoaderData<typeof alertsLoader>();

  if (loaderData.status === "unauthorized") {
    return (
      <PageShell title="Price alerts" width="reading">
        <FeedbackState kind="empty" title="Sign in to manage price alerts." />
        <p>
          <Link to="/auth/login">Sign in</Link>
        </p>
      </PageShell>
    );
  }

  return <ReadyAlerts query={loaderData.query} />;
}

function ReadyAlerts({
  query,
}: {
  query: RelayRouteQueryDescriptor<AlertsRouteQuery["variables"]>;
}) {
  const queryRef = useRoutePreloadedQuery<AlertsRouteQuery>(alertsRouteQuery, query);
  const data = usePreloadedQuery<AlertsRouteQuery>(alertsRouteQuery, queryRef);

  return (
    <AlertsWorkspace
      alerts={data.myAlertEvents.edges.map(({ node }) => node)}
      watches={data.myPriceWatches.edges.map(({ node }) => node)}
      hasMoreAlerts={data.myAlertEvents.pageInfo.hasNextPage}
      hasMoreWatches={data.myPriceWatches.pageInfo.hasNextPage}
    />
  );
}

function AlertsWorkspace({
  alerts,
  watches,
  hasMoreAlerts,
  hasMoreWatches,
}: {
  alerts: readonly AlertItemRef[];
  watches: readonly WatchItemRef[];
  hasMoreAlerts: boolean;
  hasMoreWatches: boolean;
}) {
  const revalidator = useRevalidator();
  const [errorsById, setErrorsById] = useState<ReadonlyMap<string, string>>(() => new Map());
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [commitMarkRead] = useMutation<AlertOperationsMarkAlertReadMutation>(markAlertReadMutation);
  const [commitUpdate] =
    useMutation<AlertOperationsUpdatePriceWatchMutation>(updatePriceWatchMutation);
  const [commitDelete] =
    useMutation<AlertOperationsDeletePriceWatchMutation>(deletePriceWatchMutation);
  const viewData = buildAlertsViewData(alerts, watches);

  async function run(id: string, operation: () => Promise<string | null>) {
    setPendingIds((current) => new Set(current).add(id));
    setErrorsById((current) => withoutKey(current, id));
    try {
      const operationError = await operation();
      if (operationError) setErrorsById((current) => withError(current, id, operationError));
      else await revalidator.revalidate();
    } catch {
      setErrorsById((current) => withError(current, id, DEFAULT_MUTATION_ERROR_MESSAGE));
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
        variables: { input: { id: watch.id, enabled: control.nextEnabled } },
      });
      return resolveTogglePriceWatchMutationError(response.updatePriceWatch, graphQLErrors);
    });
  }

  function deleteWatch(watch: WatchSummary) {
    return run(watch.id, async () => {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitDelete, {
        variables: { id: watch.id },
      });
      return resolveDeletePriceWatchMutationError(response.deletePriceWatch, graphQLErrors);
    });
  }

  function markRead(alert: AlertSummary) {
    return run(alert.id, async () => {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitMarkRead, {
        variables: { id: alert.id },
      });
      return resolveMarkAlertReadMutationError(response.markAlertRead, graphQLErrors);
    });
  }

  return (
    <PageShell
      eyebrow="Account"
      title="Price alerts"
      description="Changes are recorded only from fresh, in-stock offers with complete landed prices."
    >
      <div {...props(styles.workspace)}>
        <section aria-labelledby="alert-events-title" {...props(styles.section)}>
          <h2 id="alert-events-title" {...props(styles.sectionTitle)}>
            Recent changes
          </h2>
          {viewData.alerts.length === 0 ? (
            <p {...props(styles.aside)}>No qualifying price or availability changes yet.</p>
          ) : (
            <ol aria-label="Price alert events" {...props(styles.list)}>
              {viewData.alerts.map((alert) => (
                <AlertListItem
                  key={alert.id}
                  alert={alert}
                  error={errorsById.get(alert.id) ?? null}
                  onMarkRead={markRead}
                  pending={pendingIds.has(alert.id)}
                />
              ))}
            </ol>
          )}
          {hasMoreAlerts ? (
            <p {...props(styles.aside)}>Showing the 50 most recent events.</p>
          ) : null}
        </section>
        <section aria-labelledby="active-watches-title" {...props(styles.section)}>
          <h2 id="active-watches-title" {...props(styles.sectionTitle)}>
            Active watches
          </h2>
          {viewData.activeWatches.length === 0 ? (
            <p {...props(styles.aside)}>
              Create a watch from any product detail page, or resume one below.
            </p>
          ) : (
            <WatchList
              ariaLabel="Active price watches"
              watches={viewData.activeWatches}
              errorsById={errorsById}
              pendingIds={pendingIds}
              onDelete={deleteWatch}
              onToggle={toggleWatch}
            />
          )}
          {hasMoreWatches ? <p {...props(styles.aside)}>Showing the 50 newest watches.</p> : null}
        </section>
        {viewData.pausedWatches.length > 0 ? (
          <section aria-labelledby="paused-watches-title" {...props(styles.section)}>
            <h2 id="paused-watches-title" {...props(styles.sectionTitle)}>
              Paused watches
            </h2>
            <WatchList
              ariaLabel="Paused price watches"
              watches={viewData.pausedWatches}
              errorsById={errorsById}
              pendingIds={pendingIds}
              onDelete={deleteWatch}
              onToggle={toggleWatch}
            />
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}

function AlertListItem({
  alert,
  error,
  onMarkRead,
  pending,
}: {
  alert: AlertsRoute_alert$key;
  error: string | null;
  onMarkRead: (alert: AlertSummary) => Promise<void>;
  pending: boolean;
}) {
  const data = useFragment(alertFragment, alert);

  return (
    <li {...props(styles.item, data.readAt ? null : styles.unread)}>
      <strong>
        <Link to={productDetailPath(data.productSlug)}>{data.productName}</Link>
      </strong>
      <p {...props(styles.meta)}>
        <span>{alertRuleLabel(data.ruleType)}</span>
        <span>
          {data.landedPrice} {data.currency} landed
        </span>
        <span>{data.merchantName}</span>
        <time dateTime={data.observedAt}>{observationDateLabel(data.observedAt)}</time>
      </p>
      {error ? <FeedbackState kind="error" title={error} /> : null}
      {!data.readAt ? (
        <div {...props(styles.actions)}>
          <Button disabled={pending} variant="secondary" onClick={() => onMarkRead(data)}>
            Mark read
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function WatchList({
  ariaLabel,
  errorsById,
  watches,
  pendingIds,
  onDelete,
  onToggle,
}: {
  ariaLabel: string;
  errorsById: ReadonlyMap<string, string>;
  watches: readonly WatchItemRef[];
  pendingIds: ReadonlySet<string>;
  onDelete: (watch: WatchSummary) => Promise<void>;
  onToggle: (watch: WatchSummary) => Promise<void>;
}) {
  return (
    <ul aria-label={ariaLabel} {...props(styles.list)}>
      {watches.map((watch) => (
        <WatchListItem
          key={watch.id}
          error={errorsById.get(watch.id) ?? null}
          pendingIds={pendingIds}
          watch={watch}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
}

function WatchListItem({
  error,
  pendingIds,
  watch,
  onDelete,
  onToggle,
}: {
  error: string | null;
  pendingIds: ReadonlySet<string>;
  watch: WatchItemRef;
  onDelete: (watch: WatchSummary) => Promise<void>;
  onToggle: (watch: WatchSummary) => Promise<void>;
}) {
  const data = useFragment(watchFragment, watch);
  const control = priceWatchToggleControl(data);

  return (
    <li {...props(styles.item)}>
      <strong>
        <Link to={productDetailPath(data.productSlug)}>{data.productName}</Link>
      </strong>
      <p {...props(styles.meta)}>
        <span>{priceWatchLabel(data)}</span>
        {data.merchantName ? <span>{data.merchantName}</span> : null}
      </p>
      {error ? <FeedbackState kind="error" title={error} /> : null}
      <div {...props(styles.actions)}>
        <Button
          disabled={pendingIds.has(data.id)}
          variant="secondary"
          onClick={() => onToggle(data)}
        >
          {control.label}
        </Button>
        <DestructiveActionDialog
          confirmLabel="Delete price watch"
          description={`Deleting the price watch for ${data.productName} permanently stops its alerts.`}
          disabled={pendingIds.has(data.id)}
          onConfirm={() => onDelete(data)}
          title="Delete this price watch?"
          trigger={
            <Button disabled={pendingIds.has(data.id)} variant="destructive">
              Delete
            </Button>
          }
        />
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

export async function alertsLoader({
  context,
  request,
}: Route.LoaderArgs) {
  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const fetched = await fetchRouteQuery<AlertsRouteQuery>(
      environment,
      alertsRouteQuery,
      { first: 50 },
      { signal: request.signal },
    );
    return { status: "ready" as const, query: fetched.descriptor };
  } catch (error) {
    if (isAuthError(error)) return { status: "unauthorized" as const };
    throw error;
  }
}

function isAuthError(error: unknown) {
  if (!(error instanceof RouteLoaderGraphQLError)) return false;
  return graphQLResponseHasErrorCode(error.response, AUTH_CODES);
}
