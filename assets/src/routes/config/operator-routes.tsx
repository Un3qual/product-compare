import type { RouteObject } from "react-router-dom";
import { redirect } from "react-router-dom";
import { routeMetadata } from "../../frontend/head";
import { RouteErrorBoundary } from "../compare/RouteErrorBoundary";
import { withLazyRouteImportRecovery } from "./lazy-route";

export const operatorRoutes: RouteObject[] = [
  {
    path: "affiliate/setup",
    handle: routeMetadata(
      "Affiliate setup | Product Compare",
      "Configure merchant affiliate programs used for outbound offer links.",
    ),
    errorElement: <RouteErrorBoundary resourceName="affiliate setup" title="Affiliate setup" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { AffiliateSetupRoute, affiliateSetupLoader } =
        await import("../affiliate/setup/AffiliateSetupRoute");
      return { Component: AffiliateSetupRoute, loader: affiliateSetupLoader };
    }),
  },
  {
    path: "commerce/revenue",
    handle: routeMetadata(
      "Revenue preview | Product Compare",
      "Preview attributed commerce revenue and commission summaries.",
    ),
    errorElement: <RouteErrorBoundary resourceName="revenue report" title="Revenue" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { RevenueSummaryRoute, revenueSummaryLoader } =
        await import("../commerce/revenue/RevenueSummaryRoute");
      return { Component: RevenueSummaryRoute, loader: revenueSummaryLoader };
    }),
  },
  {
    path: "commerce/revenue/ingestion",
    handle: routeMetadata(
      "Conversion ingestion | Product Compare",
      "Monitor CJ commission ingestion freshness and control its bounded schedule.",
    ),
    errorElement: (
      <RouteErrorBoundary resourceName="conversion ingestion" title="Conversion ingestion" />
    ),
    lazy: withLazyRouteImportRecovery(async () => {
      const { ConversionIngestionRoute, conversionIngestionLoader } =
        await import("../commerce/revenue/ingestion/ConversionIngestionRoute");
      return { Component: ConversionIngestionRoute, loader: conversionIngestionLoader };
    }),
  },
  {
    path: "ingestion/cj-programs",
    handle: routeMetadata(
      "CJ programs | Product Compare",
      "Manage CJ advertiser programs through their lifecycle and inspect their observed feeds.",
    ),
    errorElement: <RouteErrorBoundary resourceName="CJ programs" title="CJ programs" />,
    lazy: withLazyRouteImportRecovery(async () => {
      const { CJProgramsRoute, cjProgramsLoader } =
        await import("../ingestion/cj-programs/CJProgramsRoute");
      return { Component: CJProgramsRoute, loader: cjProgramsLoader };
    }),
  },
  {
    path: "ingestion/feed-candidates",
    handle: routeMetadata(
      "CJ programs | Product Compare",
      "Manage CJ advertiser programs through their lifecycle and inspect their observed feeds.",
    ),
    loader: () => redirect("/ingestion/cj-programs"),
  },
];
