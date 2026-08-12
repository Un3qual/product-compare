import { create, props } from "@stylexjs/stylex";
import { graphql, useFragment } from "react-relay";
import type { OfferDiscoveryList_connection$key } from "$generated/OfferDiscoveryList_connection.graphql";
import { DataList, DataListItem } from "$ui/components/data/DataList";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { Pagination } from "$ui/components/navigation/Pagination";
import { tokens } from "$ui/theme/tokens.stylex";
import { formatCouponAvailabilityCount, formatOfferCount } from "../offer-formatting";
import { buildOfferSnapshotSummary, type OfferSnapshotSummary } from "../offer-snapshot";
import {
  OFFER_SNAPSHOT_SELECTORS,
  priceSortHighlightLabel,
  priceSortUsesSingleCurrency,
  renderableOffers,
  sortedRenderableOffers,
  visibleLowestPriceLabel,
  type OfferConnection,
  type RenderableOffer,
} from "./offer-discovery-data";
import { buildOfferDiscoveryPaginationData } from "./offer-discovery-filter-data";
import type { OfferDiscoveryFilters, OfferDiscoverySort } from "./offer-discovery-filter-data";
import { VisibleMerchantFilters } from "./VisibleMerchantFilters";
import { OfferDiscoveryCard } from "./OfferDiscoveryCard";

const offerDiscoveryListFragment = graphql`
  fragment OfferDiscoveryList_connection on MerchantProductConnection {
    edges {
      node {
        id
        url
        currency
        merchant {
          id
          name
        }
        latestPrice {
          price
        }
        activeCoupons(first: 2) {
          edges {
            cursor
          }
          pageInfo {
            hasNextPage
          }
        }
        ...OfferDiscoveryCard_offer
      }
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
    }
  }
`;

const styles = create({
  results: {
    display: "grid",
    gap: "1.25rem",
    paddingBlockStart: "1.25rem",
  },
  decisionHeader: {
    borderBlockColor: tokens.borderQuiet,
    borderBlockStyle: "solid",
    borderBlockWidth: "1px",
    display: "grid",
    gap: "1.25rem 2rem",
    gridTemplateColumns: {
      default: "minmax(14rem, 0.8fr) minmax(18rem, 1.2fr)",
      "@media (max-width: 42rem)": "minmax(0, 1fr)",
    },
    paddingBlock: "1rem",
  },
  overview: {
    display: "grid",
    gap: "0.65rem",
  },
  overviewTitle: {
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    margin: 0,
    textTransform: "uppercase",
  },
  overviewValue: {
    fontSize: {
      default: "2rem",
      "@media (max-width: 42rem)": "1.65rem",
    },
    fontWeight: 750,
    letterSpacing: "-0.035em",
    lineHeight: 1.1,
  },
  overviewValuePositive: {
    color: tokens.pricePositive,
  },
  overviewContext: {
    color: tokens.textSecondary,
    lineHeight: 1.55,
    margin: 0,
  },
});

export function OfferDiscoveryList({
  connection,
  filters,
}: {
  connection: OfferDiscoveryList_connection$key;
  filters: OfferDiscoveryFilters;
}) {
  const data = useFragment(offerDiscoveryListFragment, connection);
  const renderableOfferRows = renderableOffers(data);
  const canComparePrices = priceSortUsesSingleCurrency(renderableOfferRows);
  const offers = sortedRenderableOffers(renderableOfferRows, filters.sort, canComparePrices);
  const summary = buildOfferSnapshotSummary(offers, OFFER_SNAPSHOT_SELECTORS);
  return (
    <div {...props(styles.results)}>
      {offers.length === 0 ? (
        <FeedbackState kind="empty" title="No offers match these filters." />
      ) : (
        <>
          <div data-slot="offer-decision-header" {...props(styles.decisionHeader)}>
            <VisibleOfferOverview summary={summary} />
            <VisibleMerchantFilters filters={filters} offers={offers} />
          </div>
          <OfferDataList
            canComparePrices={canComparePrices}
            lowestPricedOfferId={
              summary.priceState === "comparable"
                ? (summary.lowestPricedOffer?.offer.id ?? null)
                : null
            }
            offers={offers}
            sort={filters.sort}
          />
        </>
      )}
      <OfferPagination connection={data} filters={filters} />
    </div>
  );
}

function OfferDataList({
  canComparePrices,
  lowestPricedOfferId,
  offers,
  sort,
}: {
  canComparePrices: boolean;
  lowestPricedOfferId: string | null;
  offers: RenderableOffer[];
  sort: OfferDiscoverySort;
}) {
  return (
    <DataList label="Offers">
      {offers.map((renderableOffer, index) => (
        <DataListItem key={renderableOffer.offer.id}>
          <OfferDiscoveryCard
            offer={renderableOffer.offer}
            highlightLabel={priceSortHighlightLabel(sort, index, renderableOffer, canComparePrices)}
            isBestVisiblePrice={renderableOffer.offer.id === lowestPricedOfferId}
          />
        </DataListItem>
      ))}
    </DataList>
  );
}

function VisibleOfferOverview({ summary }: { summary: OfferSnapshotSummary<RenderableOffer> }) {
  const hasComparablePrice =
    summary.priceState === "comparable" && summary.lowestPricedOffer !== null;
  const visibleOfferLabel = `${summary.visibleOfferCount} visible ${
    summary.visibleOfferCount === 1 ? "offer" : "offers"
  }.`;
  const missingPriceLabel = `${formatOfferCount(
    summary.missingPriceCount,
  )} without a current price.`;

  return (
    <section
      aria-label="Offer price overview"
      data-slot="offer-price-overview"
      {...props(styles.overview)}
    >
      <h2 {...props(styles.overviewTitle)}>Best visible price</h2>
      <strong
        data-slot="offer-overview-primary"
        data-tone={hasComparablePrice ? "positive" : "neutral"}
        {...props(styles.overviewValue, hasComparablePrice && styles.overviewValuePositive)}
      >
        {visibleLowestPriceLabel(summary)}
      </strong>
      <p {...props(styles.overviewContext)}>
        {`${visibleOfferLabel} ${formatCouponAvailabilityCount(
          summary.couponAvailabilityCount,
        )}. ${missingPriceLabel}`}
      </p>
    </section>
  );
}

function OfferPagination({
  connection,
  filters,
}: {
  connection: OfferConnection;
  filters: OfferDiscoveryFilters;
}) {
  const paginationData = buildOfferDiscoveryPaginationData({
    endCursor: connection.pageInfo.endCursor ?? null,
    filters,
    hasNextPage: connection.pageInfo.hasNextPage,
    hasPreviousPage: connection.pageInfo.hasPreviousPage,
  });

  return (
    <Pagination
      firstHref={paginationData.firstHref}
      firstLabel="First offers"
      label="Offer pages"
      nextHref={paginationData.nextHref}
      nextLabel="Next offers"
    />
  );
}
