import { useId } from "react";
import { Link } from "react-router-dom";
import type { ProductDetailRouteQuery } from "../../__generated__/ProductDetailRouteQuery.graphql";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { decimalStringToNumber } from "../decimal-values";
import { externalHttpUrlHref } from "../external-links";
import {
  graphQLDateTimeContext,
  graphQLDateTimeLabel
} from "../graphql-datetime";
import {
  ProductOfferList,
  type ProductOfferCouponRow,
  type ProductOfferListItem,
  type ProductOfferPriceHistoryRow
} from "./ProductOfferList";
import {
  formatCouponAvailabilityCount,
  formatOfferCount
} from "../offer-formatting";
import {
  buildOfferSnapshotSummary,
  type OfferSnapshotSelectors,
  type OfferSnapshotSummary
} from "../offer-snapshot";

type VisibleProductOffer = ProductOfferListItem & {
  currency: string | null;
  url: string;
  numericPrice: number | null;
};

const PRODUCT_OFFER_SNAPSHOT_SELECTORS: OfferSnapshotSelectors<VisibleProductOffer> = {
  currency: (offer) => offer.currency,
  hasCoupons: (offer) => offer.coupons.length > 0 || offer.couponsHasMore,
  numericPrice: (offer) => (hasVisiblePrice(offer) ? offer.numericPrice : null)
};

type ProductOfferNode = NonNullable<
  NonNullable<ProductDetailRouteQuery["response"]["product"]>["merchantProducts"]
>["edges"][number]["node"];
type ProductOfferConnection = NonNullable<
  NonNullable<ProductDetailRouteQuery["response"]["product"]>["merchantProducts"]
>;

export function ProductOfferPanel({
  connection,
  productSlug,
  offersAfter,
  selectedCompareSlugs
}: {
  connection: ProductOfferConnection | null | undefined;
  productSlug: string;
  offersAfter: string | null;
  selectedCompareSlugs: readonly string[];
}) {
  if (!connection) {
    return <FeedbackState kind="error" title="Offers unavailable." />;
  }

  const offers = visibleProductOffers(connection);
  const pagination = (
    <ProductOfferPagination
      connection={connection}
      offersAfter={offersAfter}
      productSlug={productSlug}
      selectedCompareSlugs={selectedCompareSlugs}
    />
  );

  if (offers.length === 0) {
    return (
      <>
        <p>No active offers yet.</p>
        {pagination}
      </>
    );
  }

  return (
    <>
      <OfferSnapshot
        summary={buildOfferSnapshotSummary(offers, PRODUCT_OFFER_SNAPSHOT_SELECTORS)}
      />
      <ProductOfferList offers={offers} />
      {pagination}
    </>
  );
}

function visibleProductOffers(connection: ProductOfferConnection) {
  return connection.edges.flatMap(({ node }) => {
    const offer = buildVisibleProductOffer(node);
    return offer ? [offer] : [];
  });
}

function ProductOfferPagination({
  connection,
  offersAfter,
  productSlug,
  selectedCompareSlugs
}: {
  connection: ProductOfferConnection;
  offersAfter: string | null;
  productSlug: string;
  selectedCompareSlugs: readonly string[];
}) {
  const nextCursor = connection.pageInfo.hasNextPage
    ? connection.pageInfo.endCursor
    : null;

  if (!offersAfter && !nextCursor) {
    return null;
  }

  return (
    <nav aria-label="Active offer pages">
      {offersAfter ? (
        <Link to={productOffersPath(productSlug, null, selectedCompareSlugs)}>
          First offers
        </Link>
      ) : null}
      {nextCursor ? (
        <Link to={productOffersPath(productSlug, nextCursor, selectedCompareSlugs)}>
          Next offers
        </Link>
      ) : null}
    </nav>
  );
}

function buildVisibleProductOffer(node: ProductOfferNode): VisibleProductOffer | null {
  const safeUrl = normalizeOfferUrl(node.url);

  if (!safeUrl) {
    return null;
  }

  return {
    id: node.id,
    currency: normalizedCurrency(node.currency),
    merchantName: productOfferMerchantName(node.merchant),
    url: safeUrl,
    ...buildLatestPriceSummary(node.latestPrice, node.currency),
    ...buildVisibleCouponSummary(node.activeCoupons),
    ...buildVisiblePriceHistorySummary(node.priceHistory, node.currency)
  };
}

function productOfferMerchantName(merchant: ProductOfferNode["merchant"]) {
  return merchant?.name ?? "Visit offer";
}

function buildLatestPriceSummary(
  latestPrice: ProductOfferNode["latestPrice"],
  currency: string
) {
  return {
    priceText: formatPriceText(latestPrice?.price, currency),
    numericPrice: decimalStringToNumber(latestPrice?.price),
    priceObservation: graphQLDateTimeContext(latestPrice?.observedAt)
  };
}

function buildVisibleCouponSummary(activeCoupons: ProductOfferNode["activeCoupons"]) {
  return {
    coupons: buildCouponRows(activeCoupons?.edges ?? []),
    couponsHasMore: activeCoupons?.pageInfo.hasNextPage ?? false
  };
}

function buildVisiblePriceHistorySummary(
  priceHistory: ProductOfferNode["priceHistory"],
  currency: string
) {
  return {
    priceHistory: buildPriceHistoryRows(priceHistory?.edges ?? [], currency),
    priceHistoryHasMore: priceHistory?.pageInfo.hasNextPage ?? false
  };
}

function OfferSnapshot({
  summary
}: {
  summary: OfferSnapshotSummary<VisibleProductOffer>;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId}>Offer snapshot</h3>
      <dl>
        <div>
          <dt>Visible active offers</dt>
          <dd>{summary.visibleOfferCount}</dd>
        </div>
        <div>
          <dt>Lowest visible price</dt>
          <dd>{lowestVisiblePriceText(summary) ?? "No visible prices"}</dd>
        </div>
        <div>
          <dt>Coupon availability</dt>
          <dd>{formatCouponAvailabilityCount(summary.couponAvailabilityCount)}</dd>
        </div>
        <div>
          <dt>Missing latest price</dt>
          <dd>{formatOfferCount(summary.missingPriceCount)}</dd>
        </div>
      </dl>
    </section>
  );
}

function hasVisiblePrice(
  offer: VisibleProductOffer
): offer is VisibleProductOffer & { currency: string; numericPrice: number; priceText: string } {
  return offer.numericPrice !== null && offer.priceText !== null && offer.currency !== null;
}

function lowestVisiblePriceText(summary: OfferSnapshotSummary<VisibleProductOffer>) {
  if (summary.priceState === "mixed") {
    return "Multiple currencies";
  }

  const lowestPricedOffer = summary.lowestPricedOffer;
  return lowestPricedOffer?.priceText
    ? `${lowestPricedOffer.priceText} at ${lowestPricedOffer.merchantName}`
    : null;
}

function productOffersPath(
  productSlug: string,
  offersAfter?: string | null,
  selectedCompareSlugs: readonly string[] = []
) {
  const params = new URLSearchParams();

  if (offersAfter) {
    params.set("offersAfter", offersAfter);
  }

  for (const slug of selectedCompareSlugs) {
    params.append("slug", slug);
  }

  const query = params.toString();
  const basePath = `/products/${encodeURIComponent(productSlug)}`;
  const path = query.length > 0 ? `${basePath}?${query}` : basePath;
  return `${path}#offers`;
}

function buildCouponRows(
  edges: ReadonlyArray<{
    readonly cursor: string;
    readonly node: {
      readonly code: string;
      readonly description: string | null | undefined;
      readonly discountType: string;
      readonly discountValue: unknown;
      readonly currency: string | null | undefined;
      readonly validTo: unknown;
      readonly terms: string | null | undefined;
    };
  }>
): ProductOfferCouponRow[] {
  return edges.map(({ cursor, node }) => ({
    key: cursor,
    code: node.code,
    description: node.description,
    discountText: formatCouponDiscountText(node.discountType, node.discountValue, node.currency),
    validToText: formatCouponValidToText(node.validTo),
    terms: node.terms
  }));
}

function buildPriceHistoryRows(
  edges: ReadonlyArray<{
    readonly node: {
      readonly id: string;
      readonly price: unknown;
      readonly observedAt: unknown;
    };
  }>,
  currency: unknown
): ProductOfferPriceHistoryRow[] {
  return edges.flatMap(({ node }) => {
    const observedDate = graphQLDateTimeLabel(node.observedAt);
    const priceText = formatPriceText(node.price, currency);

    if (!observedDate || !priceText || typeof node.observedAt !== "string") {
      return [];
    }

    return [{ id: node.id, observedAt: node.observedAt, observedDate, priceText }];
  });
}

function formatPriceText(price: unknown, currency: unknown) {
  if (typeof currency !== "string") {
    return null;
  }

  if (typeof price === "string" && decimalStringToNumber(price) !== null) {
    return `${price} ${currency}`;
  }

  if (typeof price === "number" && Number.isFinite(price)) {
    return `${price.toFixed(2)} ${currency}`;
  }

  return null;
}

function normalizedCurrency(currency: unknown) {
  if (typeof currency !== "string") {
    return null;
  }

  const trimmedCurrency = currency.trim();
  return trimmedCurrency === "" ? null : trimmedCurrency;
}

function formatCouponDiscountText(
  discountType: string,
  discountValue: unknown,
  currency: unknown
) {
  if (discountType === "FREE_SHIPPING") {
    return "Free shipping";
  }

  const valueText = formatFiniteNumberText(discountValue);

  if (!valueText) {
    return null;
  }

  if (discountType === "PERCENT") {
    return `${valueText}%`;
  }

  if (discountType === "AMOUNT" && typeof currency === "string" && currency !== "") {
    return `${valueText} ${currency}`;
  }

  return null;
}

function formatCouponValidToText(validTo: unknown) {
  const dateText = graphQLDateTimeLabel(validTo);
  return dateText ? `Valid through ${dateText}` : null;
}

function formatFiniteNumberText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (trimmedValue === "") {
    return null;
  }

  return decimalStringToNumber(trimmedValue) !== null ? trimmedValue : null;
}

function normalizeOfferUrl(rawUrl: unknown): string | null {
  return typeof rawUrl === "string" ? externalHttpUrlHref(rawUrl) : null;
}
