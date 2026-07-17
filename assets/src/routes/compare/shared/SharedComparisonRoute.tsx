import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import type { SharedComparisonRouteQuery as SharedComparisonRouteQueryType } from "../../../__generated__/SharedComparisonRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { FeedbackState } from "../../../ui/components/feedback/FeedbackState";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { tokens } from "../../../ui/theme/tokens.stylex";
import { formatProductDateTimeLabel } from "../../product-formatting";
import { buildSharedComparisonViewData } from "./shared-comparison-view-data";
import type { SharedComparisonLoaderData } from "./loader";
import sharedComparisonRouteQuery from "./queries/SharedComparisonRouteQuery";

const styles = create({
  attributeList: { display: "grid", gap: "0.5rem", margin: 0, padding: 0 },
  capture: { color: tokens.textSecondary, margin: 0 },
  disclaimer: { borderBlock: "1px solid var(--pc-border-emphasized)", margin: 0, paddingBlock: "1rem" },
  evidence: { color: tokens.textSecondary, fontSize: "0.9rem", margin: 0 },
  grid: { display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(min(18rem, 100%), 1fr))" },
  product: { display: "grid", gap: "0.85rem" },
  recommendation: { display: "grid", gap: "0.65rem" },
  title: { fontSize: "1.35rem", margin: 0 }
});

export function SharedComparisonRoute() {
  const loaderData = useLoaderData() as SharedComparisonLoaderData;

  if (loaderData.status !== "ready") {
    return (
      <PageShell eyebrow="Shared decision" title="Comparison not found">
        <FeedbackState
          kind="error"
          title="This snapshot is unavailable or has been revoked."
        />
      </PageShell>
    );
  }

  return <ReadySharedComparison query={loaderData.query} />;
}

function ReadySharedComparison({
  query
}: {
  query: Extract<SharedComparisonLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<SharedComparisonRouteQueryType>(
    sharedComparisonRouteQuery,
    query
  );
  const data = usePreloadedQuery<SharedComparisonRouteQueryType>(
    sharedComparisonRouteQuery,
    queryRef
  );
  const snapshot = data.comparisonSnapshot;

  if (!snapshot) {
    return null;
  }

  const viewData = buildSharedComparisonViewData(snapshot);

  return (
    <PageShell
      description="A fixed, source-backed record of the facts available when this comparison was published."
      eyebrow="Shared decision"
      title={viewData.title}
    >
      <p {...props(styles.capture)}>
        Captured{" "}
        <time dateTime={viewData.capturedAt}>
          {formatProductDateTimeLabel(viewData.capturedAt)}
        </time>
      </p>
      <p role="note" {...props(styles.disclaimer)}>
        {viewData.disclaimer}
      </p>
      <section
        aria-labelledby="shared-recommendation"
        {...props(styles.recommendation)}
      >
        <h2 id="shared-recommendation" {...props(styles.title)}>
          Captured recommendation
        </h2>
        <strong>{viewData.recommendation.label}</strong>
        <ul>
          {viewData.recommendation.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <p {...props(styles.evidence)}>
          Algorithm {viewData.recommendation.algorithmVersion}; evaluated{" "}
          {formatProductDateTimeLabel(viewData.recommendation.evaluatedAt)}.
        </p>
      </section>
      <section aria-label="Captured products" {...props(styles.grid)}>
        {viewData.products.map((product) => (
          <article key={product.id} {...props(styles.product)}>
            <h2 {...props(styles.title)}>{product.name}</h2>
            <p {...props(styles.capture)}>{product.brandModelLabel}</p>
            {product.description ? <p>{product.description}</p> : null}
            <dl {...props(styles.attributeList)}>
              {product.attributes.map((attribute) => (
                <div key={attribute.claimId}>
                  <dt>{attribute.displayName}</dt>
                  <dd>{attribute.valueText}</dd>
                  <p {...props(styles.evidence)}>{attribute.evidenceLabel}</p>
                </div>
              ))}
            </dl>
            {product.offers.map((offer) => (
              <p key={offer.pricePointId}>
                {offer.label}
                {offer.observedAt ? (
                  <>
                    {" "}
                    <span {...props(styles.evidence)}>
                      (observed {formatProductDateTimeLabel(offer.observedAt)})
                    </span>
                  </>
                ) : null}
              </p>
            ))}
          </article>
        ))}
      </section>
      <Link to={viewData.liveComparisonPath}>Open a live comparison</Link>
    </PageShell>
  );
}
