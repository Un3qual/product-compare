import { Suspense, useEffect, useMemo, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router";
import {
  graphql,
  useFragment,
  usePreloadedQuery,
  useQueryLoader,
  type PreloadedQuery,
} from "react-relay";
import type { HomeDealsQuery } from "$generated/HomeDealsQuery.graphql";
import type { HomeDeals_deal$key } from "$generated/HomeDeals_deal.graphql";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { DetailTabs } from "$ui/components/layout/DetailTabs";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { Button } from "$ui/primitives/Button";
import { tokens } from "$ui/theme/tokens.stylex";
import { homeProductDetailPath } from "./home-paths";

const HOME_PAGE_SIZE = 6;

const homeDealsRouteQuery = graphql`
  query HomeDealsQuery($selectedSlugs: [String!]!, $first: Int!) {
    homeDeals(selectedSlugs: $selectedSlugs) {
      new(first: $first) {
        edges {
          cursor
          ...HomeDeals_deal
        }
      }
      trending(first: $first) {
        edges {
          cursor
          ...HomeDeals_deal
        }
      }
      forYou(first: $first) {
        edges {
          cursor
          ...HomeDeals_deal
        }
      }
    }
  }
`;

const homeDealFragment = graphql`
  fragment HomeDeals_deal on HomeDealsEdge {
    node {
      id
      name
      slug
    }
    offer {
      merchantName
      currency
      landedPrice
      observedAt
    }
    reasons {
      code
      watchTarget
    }
  }
`;

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
  const [queryRef, loadQuery, disposeQuery] = useQueryLoader<HomeDealsQuery>(homeDealsRouteQuery);
  const variablesKey = selectedSlugs.join("\u0000");
  const stableSelectedSlugs = useMemo(() => [...selectedSlugs], [variablesKey]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  useEffect(() => disposeQuery, [disposeQuery]);
  useEffect(() => {
    if (!isHydrated) return;

    loadQuery(
      { first: HOME_PAGE_SIZE, selectedSlugs: stableSelectedSlugs },
      { fetchPolicy: "network-only" },
    );
  }, [isHydrated, loadQuery, stableSelectedSlugs]);

  const retry = () =>
    loadQuery(
      { first: HOME_PAGE_SIZE, selectedSlugs: stableSelectedSlugs },
      { fetchPolicy: "network-only" },
    );

  if (!isHydrated || !queryRef) {
    return <HomeDealsLoading />;
  }

  return (
    <ResettableErrorBoundary
      fallback={<HomeDealsUnavailable onRetry={retry} />}
      resetToken={queryRef}
    >
      <Suspense fallback={<HomeDealsLoading />}>
        <HomeDealsPanel
          hasViewer={hasViewer}
          queryRef={queryRef}
          selectedSlugs={stableSelectedSlugs}
        />
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
  queryRef: PreloadedQuery<HomeDealsQuery>;
  selectedSlugs: readonly string[];
}) {
  const data = usePreloadedQuery<HomeDealsQuery>(homeDealsRouteQuery, queryRef);
  const tabs = [
    {
      deals: data.homeDeals.new.edges,
      emptyTitle: "No new offers to show yet.",
      label: "New",
      value: "new",
    },
    {
      deals: data.homeDeals.trending.edges,
      emptyTitle: "No trending offers to show yet.",
      label: "Trending",
      value: "trending",
    },
    ...(hasViewer && data.homeDeals.forYou.edges.length > 0
      ? [
          {
            deals: data.homeDeals.forYou.edges,
            emptyTitle: "No offers for you to show yet.",
            label: "For you",
            value: "for-you",
          },
        ]
      : []),
  ];

  return (
    <DetailTabs
      defaultValue="new"
      items={tabs.map((tab) => ({
        content:
          tab.deals.length > 0 ? (
            <ul
              aria-label={`${tab.label} offers`}
              data-slot="home-deals-list"
              {...props(styles.list)}
            >
              {tab.deals.map(({ cursor, ...deal }) => (
                <HomeDealRow
                  fragmentRef={deal}
                  key={cursor}
                  selectedSlugs={selectedSlugs}
                  tone={tab.value === "trending" ? "warning" : "accent"}
                />
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

function HomeDealRow({
  fragmentRef,
  selectedSlugs,
  tone,
}: {
  fragmentRef: HomeDeals_deal$key;
  selectedSlugs: readonly string[];
  tone: "accent" | "warning";
}) {
  const deal = useFragment(homeDealFragment, fragmentRef);
  const reason = deal.reasons[0]
    ? homeDealReasonCopy(deal.reasons[0], deal.offer.currency)
    : "Current offer";

  return (
    <li data-slot="home-deals-item" {...props(styles.item)}>
      <Link
        data-slot="home-deals-link"
        to={homeProductDetailPath(deal.node.slug, selectedSlugs)}
        {...props(styles.link)}
      >
        {deal.node.name}
        <span aria-hidden {...props(styles.linkArrow)}>
          →
        </span>
      </Link>
      <p data-slot="home-deals-offer" {...props(styles.offer)}>
        {formatOffer(deal.offer)}
      </p>
      <StatusBadge data-slot="home-deals-reason" style={styles.reason} tone={tone}>
        {reason}
      </StatusBadge>
    </li>
  );
}

function homeDealReasonCopy(
  reason: { code: string; watchTarget: string | null },
  currency: string,
) {
  switch (reason.code) {
    case "NEW_OFFER":
      return "New offer";
    case "TRENDING_BELOW_MEDIAN":
      return "Below the 30-day price";
    case "WATCH_TARGET":
      return reason.watchTarget?.trim()
        ? `Matches your ${formatCurrency(reason.watchTarget, currency)} price watch`
        : "Matches your price watch";
    case "SAVED_COMPARISON":
      return "In your saved comparison";
    case "CURRENT_COMPARISON":
      return "In your current comparison";
    default:
      return "Current offer";
  }
}

function formatOffer(offer: { currency: string; landedPrice: string; merchantName: string }) {
  return `${formatCurrency(offer.landedPrice, offer.currency)} at ${offer.merchantName}`;
}

function formatCurrency(value: string, currency: string) {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value.trim());

  if (!match) return value;

  try {
    const [, sign, whole = "0", rawFraction = ""] = match;
    const fraction = rawFraction.padEnd(3, "0");
    let minorUnits = BigInt(whole) * 100n + BigInt(fraction.slice(0, 2));

    if (fraction[2] >= "5") minorUnits += 1n;

    const formatted = new Intl.NumberFormat("en-US", {
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: "currency",
    })
      .formatToParts(minorUnits / 100n)
      .map((part) =>
        part.type === "fraction" ? (minorUnits % 100n).toString().padStart(2, "0") : part.value,
      )
      .join("");

    return sign === "-" && minorUnits !== 0n ? `-${formatted}` : formatted;
  } catch {
    return `${value} ${currency}`;
  }
}

function HomeDealsUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <FeedbackState
      action={
        <Button onClick={onRetry} type="button" variant="secondary">
          Try again
        </Button>
      }
      kind="error"
      title="New and trending offers are unavailable right now."
    />
  );
}
