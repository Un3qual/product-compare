import { Suspense, useEffect, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { usePreloadedQuery, useQueryLoader, type PreloadedQuery } from "react-relay";
import type { HomeDealsRouteQuery } from "../../__generated__/HomeDealsRouteQuery.graphql";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { DetailTabs } from "../../ui/components/layout/DetailTabs";
import { StatusBadge } from "../../ui/components/status/StatusBadge";
import { Button } from "../../ui/primitives/Button";
import { tokens } from "../../ui/theme/tokens.stylex";
import homeDealsRouteQuery from "./queries/HomeDealsRouteQuery";
import { homeDealsViewData } from "./home-view-data";

const styles = create({
  list: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  item: {
    alignItems: "baseline",
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.35rem 1rem",
    gridTemplateColumns: {
      default: "minmax(12rem, 1fr) minmax(10rem, auto) minmax(10rem, auto)",
      "@media (max-width: 42rem)": "minmax(0, 1fr)",
    },
    paddingBlock: "0.8rem",
  },
  link: {
    alignItems: "center",
    color: tokens.actionAccent,
    display: "flex",
    fontWeight: 700,
    minHeight: "var(--pc-control-height)",
    textDecoration: "none",
  },
  linkArrow: {
    marginInlineStart: "0.3rem",
  },
  offer: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.78rem",
    lineHeight: 1.5,
    margin: 0,
  },
  reason: {
    justifySelf: {
      default: "end",
      "@media (max-width: 42rem)": "start",
    },
  },
});

export function HomeDeals({
  hasViewer,
  selectedSlugs,
}: {
  hasViewer: boolean;
  selectedSlugs: readonly string[];
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [queryRef, loadQuery, disposeQuery] =
    useQueryLoader<HomeDealsRouteQuery>(homeDealsRouteQuery);
  const variablesKey = selectedSlugs.join("\u0000");

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  useEffect(() => disposeQuery, [disposeQuery]);
  useEffect(() => {
    if (!isHydrated) return;

    loadQuery({ selectedSlugs }, { fetchPolicy: "network-only" });
  }, [isHydrated, loadQuery, selectedSlugs, variablesKey]);

  const retry = () => loadQuery({ selectedSlugs }, { fetchPolicy: "network-only" });

  if (!isHydrated || !queryRef) {
    return <HomeDealsLoading />;
  }

  return (
    <ResettableErrorBoundary
      fallback={<HomeDealsUnavailable onRetry={retry} />}
      resetToken={queryRef}
    >
      <Suspense fallback={<HomeDealsLoading />}>
        <HomeDealsPanel hasViewer={hasViewer} queryRef={queryRef} selectedSlugs={selectedSlugs} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function HomeDealsLoading() {
  return <FeedbackState kind="loading" title="Loading new and trending offers..." />;
}

function HomeDealsPanel({
  hasViewer,
  queryRef,
  selectedSlugs,
}: {
  hasViewer: boolean;
  queryRef: PreloadedQuery<HomeDealsRouteQuery>;
  selectedSlugs: readonly string[];
}) {
  const data = usePreloadedQuery<HomeDealsRouteQuery>(homeDealsRouteQuery, queryRef);
  const viewData = homeDealsViewData(data.homeDeals, hasViewer, selectedSlugs);

  return (
    <DetailTabs
      defaultValue="new"
      items={viewData.tabs.map((tab) => ({
        content:
          tab.deals.length > 0 ? (
            <ul
              aria-label={`${tab.label} offers`}
              data-slot="home-deals-list"
              {...props(styles.list)}
            >
              {tab.deals.map((deal) => (
                <li data-slot="home-deals-item" key={deal.id} {...props(styles.item)}>
                  <Link data-slot="home-deals-link" to={deal.href} {...props(styles.link)}>
                    {deal.name}
                    <span aria-hidden {...props(styles.linkArrow)}>
                      →
                    </span>
                  </Link>
                  <p data-slot="home-deals-offer" {...props(styles.offer)}>
                    {deal.offer}
                  </p>
                  <StatusBadge
                    data-slot="home-deals-reason"
                    tone={tab.value === "trending" ? "warning" : "accent"}
                    {...props(styles.reason)}
                  >
                    {deal.reason}
                  </StatusBadge>
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

function HomeDealsUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <FeedbackState
      action={
        <Button onClick={onRetry} type="button" variant="soft">
          Try again
        </Button>
      }
      kind="error"
      title="New and trending offers are unavailable right now."
    />
  );
}
