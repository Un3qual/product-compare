import { DataList, DataListItem } from "../../ui/components/data/DataList";
import { SummaryStrip } from "../../ui/components/data/SummaryStrip";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { Pagination } from "../../ui/components/navigation/Pagination";
import { StatusBadge } from "../../ui/components/status/StatusBadge";
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
  type RenderableOffer
} from "./offer-discovery-data";
import { buildOfferDiscoveryPaginationData } from "./offer-discovery-filter-data";
import type { OfferDiscoveryFilters, OfferDiscoverySort } from "./loader";
import { VisibleMerchantFilters } from "./VisibleMerchantFilters";
import { OfferDiscoveryCard } from "./OfferDiscoveryCard";

export function OfferDiscoveryList({
  connection,
  filters
}: {
  connection: OfferConnection;
  filters: OfferDiscoveryFilters;
}) {
  const renderableOfferRows = renderableOffers(connection);
  const canComparePrices = priceSortUsesSingleCurrency(renderableOfferRows);
  const offers = sortedRenderableOffers(renderableOfferRows, filters.sort, canComparePrices);

  return (
    <>
      <StatusBadge tone={filters.activeOnly ? "positive" : "neutral"}>
        {filters.activeOnly ? "Active offers" : "All offers"}
      </StatusBadge>
      {offers.length === 0 ? (
        <FeedbackState kind="empty" title="No offers match these filters." />
      ) : (
        <>
          <VisibleOfferSnapshot
            summary={buildOfferSnapshotSummary(offers, OFFER_SNAPSHOT_SELECTORS)}
          />
          <OfferDataList
            canComparePrices={canComparePrices}
            offers={offers}
            sort={filters.sort}
          />
        </>
      )}
      <VisibleMerchantFilters filters={filters} offers={offers} />
      <OfferPagination connection={connection} filters={filters} />
    </>
  );
}

function OfferDataList({
  canComparePrices,
  offers,
  sort
}: {
  canComparePrices: boolean;
  offers: RenderableOffer[];
  sort: OfferDiscoverySort;
}) {
  return (
    <DataList label="Offers">
      {offers.map((renderableOffer, index) => (
        <DataListItem key={renderableOffer.offer.id}>
          <OfferDiscoveryCard
            offer={renderableOffer.offer}
            highlightLabel={priceSortHighlightLabel(
              sort,
              index,
              renderableOffer,
              canComparePrices
            )}
          />
        </DataListItem>
      ))}
    </DataList>
  );
}

function VisibleOfferSnapshot({
  summary
}: {
  summary: OfferSnapshotSummary<RenderableOffer>;
}) {
  return (
    <SummaryStrip
      items={[
        { label: "Visible offers on this page", value: summary.visibleOfferCount },
        { label: "Lowest visible price", value: visibleLowestPriceLabel(summary) },
        {
          label: "Visible coupon availability",
          value: formatCouponAvailabilityCount(summary.couponAvailabilityCount)
        },
        { label: "Missing latest price", value: formatOfferCount(summary.missingPriceCount) }
      ]}
      label="Visible offer snapshot"
    />
  );
}

function OfferPagination({
  connection,
  filters
}: {
  connection: OfferConnection;
  filters: OfferDiscoveryFilters;
}) {
  const paginationData = buildOfferDiscoveryPaginationData({
    endCursor: connection.pageInfo.endCursor ?? null,
    filters,
    hasNextPage: connection.pageInfo.hasNextPage,
    hasPreviousPage: connection.pageInfo.hasPreviousPage
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
