import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import type { MerchantDetailRouteQuery as MerchantDetailRouteQueryType } from "../../../__generated__/MerchantDetailRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { SummaryStrip } from "../../../ui/components/data/SummaryStrip";
import { FeedbackState } from "../../../ui/components/feedback/FeedbackState";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { externalWebsiteHref } from "../../external-links";
import { formatProductDateLabel } from "../../product-formatting";
import type { MerchantDetailLoaderData } from "./loader";
import merchantDetailRouteQuery from "./queries/MerchantDetailRouteQuery";

const styles = create({
  list: { display: "grid", gap: "1rem", listStyle: "none", margin: 0, padding: 0 },
  offer: { borderBlockStart: "1px solid var(--pc-border-quiet)", display: "grid", gap: "0.45rem", paddingBlockStart: "1rem" },
  secondary: { color: "var(--pc-text-secondary)", margin: 0 }
});

export function MerchantDetailRoute() {
  const loaderData = useLoaderData() as MerchantDetailLoaderData;
  if (loaderData.status !== "ready") return <PageShell eyebrow="Seller detail" title="Merchant not found"><FeedbackState kind="error" title="This merchant is unavailable." /></PageShell>;

  return <ReadyMerchantDetail query={loaderData.query} />;
}

function ReadyMerchantDetail({ query }: { query: Extract<MerchantDetailLoaderData, { status: "ready" }>["query"] }) {
  const queryRef = useRoutePreloadedQuery<MerchantDetailRouteQueryType>(merchantDetailRouteQuery, query);
  const data = usePreloadedQuery<MerchantDetailRouteQueryType>(merchantDetailRouteQuery, queryRef);
  const merchant = data.merchant;
  if (!merchant) return null;
  const websiteHref = externalWebsiteHref(merchant.domain);
  const summary = merchant.detailSummary;

  return <PageShell eyebrow="Seller detail" title={merchant.name} description={<>Current catalog and offer evidence for {merchant.domain}. {websiteHref ? <a href={websiteHref} target="_blank" rel="noopener noreferrer">Visit merchant website</a> : null}</>}>
    <SummaryStrip label="Merchant coverage" items={[
      { label: "Active offers", value: summary.activeOfferCount },
      { label: "Products", value: summary.distinctProductCount },
      { label: "Eligible landed prices", value: summary.eligibleOfferCount },
      { label: "Fresh observations", value: summary.freshOfferCount }
    ]} />
    <p {...props(styles.secondary)}>{summary.lastObservedAt ? <>Latest captured observation <time dateTime={summary.lastObservedAt}>{formatProductDateLabel(summary.lastObservedAt)}</time>.</> : "No offer observations are available yet."} {summary.agingOfferCount} aging, {summary.staleOfferCount} stale, and {summary.unobservedOfferCount} unobserved active offers.</p>
    {merchant.merchantProducts.edges.length ? <ul aria-label="Merchant product offers" {...props(styles.list)}>{merchant.merchantProducts.edges.map(({ node }) => <li key={node.id} {...props(styles.offer)}>{node.product ? <strong><Link to={`/products/${node.product.slug}`}>{node.product.name}</Link></strong> : <strong>Unavailable product</strong>}{node.latestPrice ? <p>{node.latestPrice.price} {node.currency}{node.latestPrice.shipping == null ? " plus unknown shipping" : ` + ${node.latestPrice.shipping} shipping`} · {node.latestPrice.inStock === false ? "Out of stock" : node.latestPrice.inStock === true ? "In stock" : "Stock unknown"}</p> : <p>No price observation yet.</p>}</li>)}</ul> : <FeedbackState kind="empty" title="No active merchant offers yet." />}
    {merchant.merchantProducts.pageInfo.hasNextPage && merchant.merchantProducts.pageInfo.endCursor ? <Link to={`/merchants/${merchant.slug}?after=${encodeURIComponent(merchant.merchantProducts.pageInfo.endCursor)}`}>Next offers</Link> : null}
    <Link to="/merchants">Back to all merchants</Link>
  </PageShell>;
}
