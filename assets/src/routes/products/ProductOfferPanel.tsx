import { useId } from "react";
import { Link } from "react-router-dom";
import type { ProductDetailRouteQuery } from "../../__generated__/ProductDetailRouteQuery.graphql";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { decimalStringToNumber } from "../decimal-values";
import { externalHttpUrlHref } from "../external-links";
import {
  graphQLDateTimeContext,
  graphQLDateTimeLabel,
  type GraphQLDateTimeContext
} from "../graphql-datetime";
import {
  formatCouponAvailabilityCount,
  formatOfferCount
} from "../offer-formatting";
import {
  buildOfferSnapshotSummary,
  type OfferSnapshotSelectors,
  type OfferSnapshotSummary
} from "../offer-snapshot";
import { TrackedCommerceClickAction } from "../offers/TrackedCommerceClickAction";

type VisibleProductOffer = {
  currency: string | null;
  id: string;
  merchantName: string;
  url: string;
  priceText: string | null;
  numericPrice: number | null;
  priceObservation: GraphQLDateTimeContext | null;
  coupons: ReturnType<typeof buildCouponRows>;
  couponsHasMore: boolean;
  priceHistory: ReturnType<typeof buildPriceHistoryRows>;
  priceHistoryHasMore: boolean;
};

const PRODUCT_OFFER_SNAPSHOT_SELECTORS: OfferSnapshotSelectors<VisibleProductOffer> = {
  currency: (offer) => offer.currency,
  hasCoupons: (offer) => offer.coupons.length > 0 || offer.couponsHasMore,
  numericPrice: (offer) => (hasVisiblePrice(offer) ? offer.numericPrice : null)
};

type ProductOfferNode = NonNullable<
  NonNullable<ProductDetailRouteQuery["response"]["product"]>["merchantProducts"]
>["edges"][number]["node"];

export function ProductOfferPanel({
  connection,
  productSlug,
  offersAfter,
  selectedCompareSlugs
}: {
  connection: NonNullable<ProductDetailRouteQuery["response"]["product"]>["merchantProducts"];
  productSlug: string;
  offersAfter: string | null;
  selectedCompareSlugs: readonly string[];
}) {
  if (!connection) {
    return <FeedbackState kind="error" title="Offers unavailable." />;
  }

  const offers = connection.edges.flatMap(({ node }) => {
    const offer = buildVisibleProductOffer(node);
    return offer ? [offer] : [];
  });
  const paginationLinks =
    offersAfter || (connection.pageInfo.hasNextPage && connection.pageInfo.endCursor) ? (
      <nav aria-label="Active offer pages">
        {offersAfter ? (
          <Link to={productOffersPath(productSlug, null, selectedCompareSlugs)}>
            First offers
          </Link>
        ) : null}
        {connection.pageInfo.hasNextPage && connection.pageInfo.endCursor ? (
          <Link
            to={productOffersPath(
              productSlug,
              connection.pageInfo.endCursor,
              selectedCompareSlugs
            )}
          >
            Next offers
          </Link>
        ) : null}
      </nav>
    ) : null;

  if (offers.length === 0) {
    return (
      <>
        <p>No active offers yet.</p>
        {paginationLinks}
      </>
    );
  }

  return (
    <>
      <OfferSnapshot
        summary={buildOfferSnapshotSummary(offers, PRODUCT_OFFER_SNAPSHOT_SELECTORS)}
      />
      <ActiveOfferList offers={offers} />
      {paginationLinks}
    </>
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
    merchantName: node.merchant?.name ?? "Visit offer",
    url: safeUrl,
    priceText: formatPriceText(node.latestPrice?.price, node.currency),
    numericPrice: decimalStringToNumber(node.latestPrice?.price),
    priceObservation: graphQLDateTimeContext(node.latestPrice?.observedAt),
    coupons: buildCouponRows(node.activeCoupons?.edges ?? []),
    couponsHasMore: node.activeCoupons?.pageInfo.hasNextPage ?? false,
    priceHistory: buildPriceHistoryRows(node.priceHistory?.edges ?? [], node.currency),
    priceHistoryHasMore: node.priceHistory?.pageInfo.hasNextPage ?? false
  };
}

function ActiveOfferList({ offers }: { offers: VisibleProductOffer[] }) {
  return (
    <ul aria-label="Active offer list">
      {offers.map((offer) => (
        <li key={offer.id}>
          <TrackedCommerceClickAction
            label={offer.merchantName}
            merchantProductId={offer.id}
          />
          {offer.priceText ? <p>{offer.priceText}</p> : null}
          {offer.priceObservation ? (
            <p>
              Price observed{" "}
              <time dateTime={offer.priceObservation.dateTime}>
                {offer.priceObservation.label}
              </time>
            </p>
          ) : null}
          <OfferPriceHistory
            merchantName={offer.merchantName}
            historyRows={offer.priceHistory}
            hasMore={offer.priceHistoryHasMore}
          />
          <OfferCoupons
            merchantName={offer.merchantName}
            coupons={offer.coupons}
            hasMore={offer.couponsHasMore}
          />
        </li>
      ))}
    </ul>
  );
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

function OfferPriceHistory({
  merchantName,
  historyRows,
  hasMore
}: {
  merchantName: string;
  historyRows: ReadonlyArray<{
    id: string;
    observedAt: string;
    observedDate: string;
    priceText: string;
  }>;
  hasMore: boolean;
}) {
  if (historyRows.length === 0) {
    return <p>No price history for this offer yet.</p>;
  }

  return (
    <section>
      <h3>Price history</h3>
      <ul aria-label={`${merchantName} price history`}>
        {historyRows.map((row) => (
          <li key={row.id}>
            <time dateTime={row.observedAt}>{row.observedDate}</time>
            <span>{row.priceText}</span>
          </li>
        ))}
      </ul>
      {hasMore ? <p>More price history available.</p> : null}
    </section>
  );
}

function OfferCoupons({
  merchantName,
  coupons,
  hasMore
}: {
  merchantName: string;
  coupons: ReadonlyArray<{
    key: string;
    code: string;
    description: string | null | undefined;
    discountText: string | null;
    validToText: string | null;
    terms: string | null | undefined;
  }>;
  hasMore: boolean;
}) {
  if (coupons.length === 0) {
    return <p>No active coupons for this offer.</p>;
  }

  return (
    <>
      <ul aria-label={`${merchantName} active coupons`}>
        {coupons.map((coupon) => (
          <li key={coupon.key}>
            <strong>{coupon.code}</strong>
            {coupon.description ? <p>{coupon.description}</p> : null}
            {coupon.discountText ? <p>{coupon.discountText}</p> : null}
            {coupon.validToText ? <p>{coupon.validToText}</p> : null}
            {coupon.terms ? <p>{coupon.terms}</p> : null}
          </li>
        ))}
      </ul>
      {hasMore ? <p>More coupons available.</p> : null}
    </>
  );
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
) {
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
) {
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
