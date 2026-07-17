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
import { getMerchantDetailViewData } from "./merchant-detail-view-data";
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
  const viewData = getMerchantDetailViewData(merchant);

  return <PageShell eyebrow="Seller detail" title={merchant.name} description={<>Current catalog and offer evidence for {merchant.domain}. {websiteHref ? <a href={websiteHref} target="_blank" rel="noopener noreferrer">Visit merchant website</a> : null}</>}>
    <SummaryStrip label="Merchant coverage" items={viewData.summaryItems} />
    <p {...props(styles.secondary)}>{viewData.observation.lastObservedAt ? <>{viewData.observation.leadCopy} <time dateTime={viewData.observation.lastObservedAt}>{formatProductDateLabel(viewData.observation.lastObservedAt)}</time>.</> : viewData.observation.leadCopy} {viewData.observation.freshnessCopy}</p>
    {viewData.offerRows.length ? <ul aria-label="Merchant product offers" {...props(styles.list)}>{viewData.offerRows.map((offer) => <li key={offer.id} {...props(styles.offer)}>{offer.product ? <strong><Link to={offer.product.path}>{offer.product.name}</Link></strong> : <strong>Unavailable product</strong>}<p>{offer.priceCopy}</p></li>)}</ul> : <FeedbackState kind="empty" title="No active merchant offers yet." />}
    {viewData.nextPagePath ? <Link to={viewData.nextPagePath}>Next offers</Link> : null}
    <Link to="/merchants">Back to all merchants</Link>
  </PageShell>;
}
