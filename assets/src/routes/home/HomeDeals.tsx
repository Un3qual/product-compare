import { Suspense, useEffect, useState } from "react";
import { Await, Link, useRevalidator } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import type { HomeDealsRouteQuery } from "../../__generated__/HomeDealsRouteQuery.graphql";
import { useRoutePreloadedQuery, type RelayRouteQueryDescriptor } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { DetailTabs } from "../../ui/components/layout/DetailTabs";
import { Button } from "../../ui/primitives/Button";
import homeDealsRouteQuery from "./queries/HomeDealsRouteQuery";
import { homeDealsViewData } from "./home-view-data";

export function HomeDeals({
  deals,
  hasViewer,
  selectedSlugs,
}: {
  deals: Promise<RelayRouteQueryDescriptor<HomeDealsRouteQuery["variables"]> | null>;
  hasViewer: boolean;
  selectedSlugs: readonly string[];
}) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated ? (
    <Suspense
      fallback={<FeedbackState kind="loading" title="Loading new and trending offers..." />}
    >
      <Await resolve={deals} errorElement={<HomeDealsUnavailable />}>
        {(query) =>
          query ? (
            <HomeDealsBoundary hasViewer={hasViewer} query={query} selectedSlugs={selectedSlugs} />
          ) : (
            <HomeDealsUnavailable />
          )
        }
      </Await>
    </Suspense>
  ) : (
    <FeedbackState kind="loading" title="Loading new and trending offers..." />
  );
}

function HomeDealsBoundary({
  hasViewer,
  query,
  selectedSlugs,
}: {
  hasViewer: boolean;
  query: RelayRouteQueryDescriptor<HomeDealsRouteQuery["variables"]>;
  selectedSlugs: readonly string[];
}) {
  return (
    <ResettableErrorBoundary fallback={<HomeDealsUnavailable />} resetToken={query}>
      <Suspense
        fallback={<FeedbackState kind="loading" title="Loading new and trending offers..." />}
      >
        <HomeDealsPanel hasViewer={hasViewer} query={query} selectedSlugs={selectedSlugs} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function HomeDealsPanel({
  hasViewer,
  query,
  selectedSlugs,
}: {
  hasViewer: boolean;
  query: RelayRouteQueryDescriptor<HomeDealsRouteQuery["variables"]>;
  selectedSlugs: readonly string[];
}) {
  const queryRef = useRoutePreloadedQuery<HomeDealsRouteQuery>(homeDealsRouteQuery, query);
  const data = usePreloadedQuery<HomeDealsRouteQuery>(homeDealsRouteQuery, queryRef);
  const viewData = homeDealsViewData(data.homeDeals, hasViewer, selectedSlugs);

  return (
    <DetailTabs
      defaultValue="new"
      items={viewData.tabs.map((tab) => ({
        content:
          tab.deals.length > 0 ? (
            <ul aria-label={`${tab.label} offers`}>
              {tab.deals.map((deal) => (
                <li key={deal.id}>
                  <Link to={deal.href}>{deal.name}</Link>
                  <p>{deal.offer}</p>
                  <p>{deal.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <FeedbackState kind="empty" title={tab.emptyTitle} />
          ),
        label: tab.label,
        value: tab.value,
      }))}
      label="Offer lists"
    />
  );
}

function HomeDealsUnavailable() {
  const revalidator = useRevalidator();

  return (
    <FeedbackState
      action={
        <Button onClick={() => revalidator.revalidate()} type="button" variant="soft">
          Try again
        </Button>
      }
      kind="error"
      title="New and trending offers are unavailable right now."
    />
  );
}
