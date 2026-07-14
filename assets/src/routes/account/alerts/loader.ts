import type { LoaderFunctionArgs } from "react-router-dom";
import { RouteLoaderGraphQLError } from "../../../relay/environment";
import alertsRouteQuery, {
  type AlertsRouteQuery
} from "../../../__generated__/AlertsRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor
} from "../../../relay/route-preload";
import { isRouteRecord } from "../../route-errors";

export type AlertSummary = {
  id: string;
  productName: string;
  productSlug: string;
  merchantName: string;
  ruleType: string;
  currency: string;
  landedPrice: string;
  observedAt: string;
  readAt: string | null;
};

export type WatchSummary = {
  id: string;
  productName: string;
  productSlug: string;
  merchantName: string | null;
  ruleType: string;
  currency: string;
  targetAmount: string | null;
  percentageDrop: string | null;
  baselineLandedPrice: string | null;
  enabled: boolean;
};

export type AlertsRouteLoaderData =
  | {
      status: "ready";
      alerts: AlertSummary[];
      watches: WatchSummary[];
      hasMoreAlerts: boolean;
      hasMoreWatches: boolean;
      query: RelayRouteQueryDescriptor<AlertsRouteQuery["variables"]>;
    }
  | { status: "unauthorized" };

const AUTH_CODES = new Set(["UNAUTHENTICATED"]);

export async function alertsLoader({ context, request }: LoaderFunctionArgs): Promise<AlertsRouteLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  let fetched: Awaited<ReturnType<typeof fetchRouteQuery<AlertsRouteQuery>>> | null = null;

  try {
    fetched = await fetchRouteQuery<AlertsRouteQuery>(
      environment,
      alertsRouteQuery,
      { first: 50 },
      { signal: request.signal }
    );
    const summary = summarizeAlertsRoute(fetched.data);

    return { status: "ready", query: fetched.descriptor, ...summary };
  } catch (error) {
    fetched?.dispose();

    if (isAuthError(error)) {
      return { status: "unauthorized" };
    }

    throw error;
  }
}

export function summarizeAlertsRoute(data: unknown) {
  const record = isRouteRecord(data) ? data : null;
  const alertConnection = record && isRouteRecord(record.myAlertEvents) ? record.myAlertEvents : null;
  const watchConnection = record && isRouteRecord(record.myPriceWatches) ? record.myPriceWatches : null;

  if (!alertConnection || !watchConnection) {
    throw new Error("Failed to parse price alerts response");
  }

  return {
    alerts: connectionNodes(alertConnection).flatMap(normalizeAlert),
    watches: connectionNodes(watchConnection).flatMap(normalizeWatch),
    hasMoreAlerts: pageHasMore(alertConnection),
    hasMoreWatches: pageHasMore(watchConnection)
  };
}

function connectionNodes(connection: Record<string, unknown>): unknown[] {
  return Array.isArray(connection.edges)
    ? connection.edges.flatMap((edge) => (isRouteRecord(edge) ? [edge.node] : []))
    : [];
}

function pageHasMore(connection: Record<string, unknown>) {
  return isRouteRecord(connection.pageInfo) && connection.pageInfo.hasNextPage === true;
}

function normalizeAlert(value: unknown): AlertSummary[] {
  if (!isRouteRecord(value)) return [];
  const required = ["id", "productName", "productSlug", "merchantName", "ruleType", "currency", "landedPrice", "observedAt"];
  if (!required.every((key) => typeof value[key] === "string")) return [];

  return [value as AlertSummary];
}

function normalizeWatch(value: unknown): WatchSummary[] {
  if (!isRouteRecord(value)) return [];
  const required = ["id", "productName", "productSlug", "ruleType", "currency"];
  if (!required.every((key) => typeof value[key] === "string") || typeof value.enabled !== "boolean") return [];

  return [value as WatchSummary];
}

function isAuthError(error: unknown) {
  if (!(error instanceof RouteLoaderGraphQLError)) return false;
  const response = error.response;
  if (!isRouteRecord(response) || !Array.isArray(response.errors)) return false;
  return response.errors.some((item) => {
    if (!isRouteRecord(item) || !isRouteRecord(item.extensions)) return false;
    return typeof item.extensions.code === "string" && AUTH_CODES.has(item.extensions.code);
  });
}
